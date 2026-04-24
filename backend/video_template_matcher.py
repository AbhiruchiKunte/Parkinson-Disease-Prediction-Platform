from __future__ import annotations

import math
import os
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np

try:
    import cv2  # type: ignore
except Exception as exc:  # pragma: no cover
    cv2 = None
    CV2_IMPORT_ERROR = exc
else:
    CV2_IMPORT_ERROR = None


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


class VideoTemplateMatcher:
    """
    Lightweight template matcher using motion statistics extracted from videos.
    This is intended for demo/prototype use with reference template videos.
    """

    def __init__(
        self,
        template_dir: str = "ml_models/video_templates",
        normal_template: str = "normal.mp4",
        parkinson_template: str = "parkinson.mp4",
    ) -> None:
        base = Path(template_dir)
        if not base.is_absolute():
            base = (Path(__file__).parent / base).resolve()
        self.template_dir = base
        self.normal_template_name = normal_template
        self.parkinson_template_name = parkinson_template
        self._template_cache: Dict[str, Tuple[float, Dict[str, float], List[float]]] = {}

    def _resolve_template_paths(self) -> Tuple[Path, Path]:
        normal_env = os.environ.get("VIDEO_TEMPLATE_NORMAL")
        pd_env = os.environ.get("VIDEO_TEMPLATE_PD")

        normal_path = Path(normal_env) if normal_env else self.template_dir / self.normal_template_name
        pd_path = Path(pd_env) if pd_env else self.template_dir / self.parkinson_template_name

        if not normal_path.is_absolute():
            normal_path = (Path(__file__).parent / normal_path).resolve()
        if not pd_path.is_absolute():
            pd_path = (Path(__file__).parent / pd_path).resolve()

        return normal_path, pd_path

    @staticmethod
    def _dominant_frequency(signal: np.ndarray, fps: float) -> float:
        if len(signal) < 16 or fps <= 0:
            return 0.0

        centered = signal - np.mean(signal)
        spectrum = np.abs(np.fft.rfft(centered))
        freqs = np.fft.rfftfreq(len(centered), d=1.0 / fps)

        band_mask = (freqs >= 0.3) & (freqs <= 8.0)
        if not np.any(band_mask):
            return 0.0

        band_spec = spectrum[band_mask]
        band_freqs = freqs[band_mask]
        if band_spec.size == 0:
            return 0.0

        return float(band_freqs[int(np.argmax(band_spec))])

    @staticmethod
    def _downsample_to_percent(series: np.ndarray, max_points: int = 30) -> List[float]:
        if series.size == 0:
            return []
        if series.size <= max_points:
            sampled = series
        else:
            idx = np.linspace(0, series.size - 1, max_points).astype(int)
            sampled = series[idx]

        smin = float(np.min(sampled))
        smax = float(np.max(sampled))
        denom = (smax - smin) if (smax - smin) > 1e-9 else 1.0
        normalized = ((sampled - smin) / denom) * 100.0
        return [round(float(v), 2) for v in normalized]

    def _extract_video_features(
        self, video_path: Path, max_frames: int = 220, frame_step: int = 2
    ) -> Tuple[Dict[str, float], List[float], float]:
        if cv2 is None:  # pragma: no cover
            raise RuntimeError(
                f"OpenCV is required for video analysis but is unavailable: {CV2_IMPORT_ERROR}"
            )

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Unable to open video file: {video_path}")

        fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
        if fps <= 1e-3:
            fps = 30.0
        effective_fps = fps / max(1, frame_step)

        prev_gray = None
        energies: List[float] = []
        horizontal_ratios: List[float] = []
        asymmetries: List[float] = []
        centroids: List[Tuple[float, float]] = []

        frame_idx = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame_idx += 1
            if frame_idx % frame_step != 0:
                continue

            h, w = frame.shape[:2]
            if w > 320:
                new_w = 320
                new_h = int(h * (new_w / w))
                frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            if prev_gray is not None:
                flow = cv2.calcOpticalFlowFarneback(
                    prev_gray,
                    gray,
                    None,
                    0.5,
                    3,
                    15,
                    3,
                    5,
                    1.2,
                    0,
                )

                fx = flow[..., 0]
                fy = flow[..., 1]
                mag = np.sqrt((fx * fx) + (fy * fy))
                energies.append(float(np.mean(mag)))

                h_comp = float(np.mean(np.abs(fx)))
                v_comp = float(np.mean(np.abs(fy)))
                horizontal_ratios.append(h_comp / (h_comp + v_comp + 1e-6))

                mid = mag.shape[1] // 2
                left = mag[:, :mid]
                right = mag[:, mid:]
                asymmetries.append(float(abs(np.mean(left) - np.mean(right))))

                threshold = float(np.percentile(mag, 75))
                mask = mag >= threshold
                coords = np.argwhere(mask)
                if coords.size > 0:
                    cy, cx = np.mean(coords, axis=0)
                    centroids.append((float(cx), float(cy)))

            prev_gray = gray
            if len(energies) >= max_frames:
                break

        cap.release()

        if len(energies) < 12:
            raise RuntimeError("Video is too short or lacks sufficient motion for analysis")

        energy_arr = np.asarray(energies, dtype=np.float64)
        diff_arr = np.diff(energy_arr)

        mean_energy = float(np.mean(energy_arr))
        std_energy = float(np.std(energy_arr))
        tremor_proxy = float(np.mean(np.abs(diff_arr)))
        irregularity = float(std_energy / (mean_energy + 1e-6))
        cadence_hz = self._dominant_frequency(energy_arr, effective_fps)
        horizontal_bias = float(np.mean(horizontal_ratios)) if horizontal_ratios else 0.5
        asymmetry = float(np.mean(asymmetries)) if asymmetries else 0.0

        if len(centroids) >= 4:
            cent_arr = np.asarray(centroids, dtype=np.float64)
            center_mean = np.mean(cent_arr, axis=0)
            radial = np.sqrt(np.sum((cent_arr - center_mean) ** 2, axis=1))
            centroid_jitter = float(np.mean(radial) / (max(prev_gray.shape) + 1e-6))
        else:
            centroid_jitter = 0.0

        features = {
            "mean_energy": mean_energy,
            "std_energy": std_energy,
            "tremor_proxy": tremor_proxy,
            "irregularity": irregularity,
            "cadence_hz": cadence_hz,
            "horizontal_bias": horizontal_bias,
            "asymmetry": asymmetry,
            "centroid_jitter": centroid_jitter,
        }

        return features, self._downsample_to_percent(energy_arr), effective_fps

    def _load_template(self, kind: str, template_path: Path) -> Tuple[Dict[str, float], List[float]]:
        if not template_path.exists():
            raise RuntimeError(
                f"Missing {kind} template video at: {template_path}. "
                "Place reference files in backend/ml_models/video_templates/"
            )

        cache_key = str(template_path.resolve())
        mtime = template_path.stat().st_mtime
        cached = self._template_cache.get(cache_key)
        if cached and math.isclose(cached[0], mtime, rel_tol=0.0, abs_tol=1e-9):
            return cached[1], cached[2]

        features, series, _fps = self._extract_video_features(template_path)
        self._template_cache[cache_key] = (mtime, features, series)
        return features, series

    @staticmethod
    def _normalized_distance(a: Dict[str, float], b: Dict[str, float]) -> float:
        keys = [
            "mean_energy",
            "std_energy",
            "tremor_proxy",
            "irregularity",
            "cadence_hz",
            "horizontal_bias",
            "asymmetry",
            "centroid_jitter",
        ]
        terms = []
        for k in keys:
            av = float(a.get(k, 0.0))
            bv = float(b.get(k, 0.0))
            scale = abs(bv) + 1e-3
            terms.append(abs(av - bv) / scale)
        return float(np.mean(terms))

    def predict(self, uploaded_video_path: str | Path) -> Dict[str, object]:
        upload_path = Path(uploaded_video_path)
        if not upload_path.exists():
            raise RuntimeError(f"Uploaded video not found: {upload_path}")

        normal_template_path, pd_template_path = self._resolve_template_paths()
        normal_template_features, _ = self._load_template("normal", normal_template_path)
        pd_template_features, _ = self._load_template("parkinson", pd_template_path)

        video_features, tremor_series_raw, fps = self._extract_video_features(upload_path)

        dist_normal = self._normalized_distance(video_features, normal_template_features)
        dist_pd = self._normalized_distance(video_features, pd_template_features)

        margin = (dist_normal - dist_pd) / (dist_normal + dist_pd + 1e-6)
        pd_probability = 1.0 / (1.0 + math.exp(-4.0 * margin))
        pd_probability = max(0.0, min(1.0, pd_probability))

        prediction_label = "Parkinson" if pd_probability >= 0.5 else "Normal"
        prediction_confidence = pd_probability if prediction_label == "Parkinson" else (1.0 - pd_probability)

        gait_metrics = [
            {
                "name": "Stride Length",
                "value": round(_clamp(100 - (video_features["irregularity"] * 120) - (video_features["asymmetry"] * 250)), 2),
                "fill": "#8b5cf6",
            },
            {
                "name": "Arm Swing",
                "value": round(_clamp(100 - (abs(video_features["horizontal_bias"] - 0.5) * 260)), 2),
                "fill": "#ec4899",
            },
            {
                "name": "Posture",
                "value": round(_clamp(100 - (video_features["centroid_jitter"] * 250)), 2),
                "fill": "#10b981",
            },
            {
                "name": "Stability",
                "value": round(_clamp(100 - (video_features["tremor_proxy"] * 220)), 2),
                "fill": "#3b82f6",
            },
            {
                "name": "Turning Speed",
                "value": round(_clamp(100 - (abs(video_features["cadence_hz"] - normal_template_features.get("cadence_hz", 1.6)) * 30)), 2),
                "fill": "#f59e0b",
            },
        ]

        posture_radar = [
            {"subject": "Forward", "A": round(_clamp(100 - video_features["centroid_jitter"] * 250), 2), "fullMark": 100},
            {"subject": "Backward", "A": round(_clamp(100 - video_features["irregularity"] * 110), 2), "fullMark": 100},
            {"subject": "Left", "A": round(_clamp(100 - video_features["asymmetry"] * 260), 2), "fullMark": 100},
            {"subject": "Right", "A": round(_clamp(100 - (abs(video_features["horizontal_bias"] - 0.5) * 200)), 2), "fullMark": 100},
        ]

        tremor_series = []
        if tremor_series_raw:
            step = 1.0 / max(fps, 1e-6)
            for idx, value in enumerate(tremor_series_raw):
                tremor_series.append(
                    {
                        "t": f"{round(idx * step, 1)}s",
                        "mag": float(value),
                    }
                )

        details = (
            f"Template match distances -> PD: {dist_pd:.3f}, Normal: {dist_normal:.3f}. "
            f"Cadence proxy: {video_features['cadence_hz']:.2f} Hz; "
            f"Tremor proxy: {video_features['tremor_proxy']:.4f}."
        )

        return {
            "prediction_label": prediction_label,
            "prediction_confidence": round(prediction_confidence, 4),
            "pd_probability": round(pd_probability, 4),
            "prediction_status": "High Risk" if pd_probability >= 0.5 else "Low Risk",
            "analysis_method": "template-matching",
            "details": details,
            "distance_to_pd_template": round(dist_pd, 4),
            "distance_to_normal_template": round(dist_normal, 4),
            "video_features": {
                k: round(float(v), 6) for k, v in video_features.items()
            },
            "tremor_series": tremor_series,
            "gait_metrics": gait_metrics,
            "posture_radar": posture_radar,
            "template_files": {
                "normal": str(normal_template_path),
                "parkinson": str(pd_template_path),
            },
        }

