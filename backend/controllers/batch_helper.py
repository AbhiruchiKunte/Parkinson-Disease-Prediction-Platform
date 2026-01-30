
try:
    from docx import Document
except ImportError:
    Document = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

import pandas as pd
import io


def parse_text_table(text):
    """
    Attempts to parse text containing a table (whitespace/tab separated).
    Returns DataFrame or None if no table structure found.
    Handles pandas read_csv failures by falling back to manual line parsing.
    """
    import io
    import re
    
    # Pre-process text to remove common garbage or empty lines
    lines = [line.strip() for line in text.replace('\r', '\n').split('\n') if line.strip()]
    if len(lines) < 2:
        return None
        
    # Strategy 1: strict pandas read_csv
    try:
        clean_text = '\n'.join(lines)
        df = pd.read_csv(io.StringIO(clean_text), sep=r'\s+', engine='python')
        if len(df) > 0 and len(df.columns) > 1:
            return df
    except Exception:
        pass

    # Strategy 2: Manual Line Parsing (Robust Fallback)
    # Useful when headers are messy or pd.read_csv trips on a single bad line
    try:
        data = []
        headers = []
        header_idx = -1
        
        # Keywords to identify the header row
        keywords = ['patient', 'id', 'age', 'tremor', 'handwriting', 'spiral', 'drawing', 'pressure', 'velocity', 'speed', 'jitter', 'shimmer', 'score', 'count']
        
        # Find header line
        for i, line in enumerate(lines):
            lower_line = line.lower()
            # If line has at least 2 keywords, treat as header
            matches = sum(1 for k in keywords if k in lower_line)
            if matches >= 2:
                # Basic tokenization
                headers = re.split(r'\s+', line)
                header_idx = i
                break
        
        if header_idx != -1 and headers:
            num_cols = len(headers)
            # Parse subsequent lines
            for line in lines[header_idx+1:]:
                parts = re.split(r'\s+', line)
                
                # Perfect match
                if len(parts) == num_cols:
                    data.append(dict(zip(headers, parts)))
                # Handle cases where ID might have a space "PD 001" -> 2 tokens, makes len = num_cols + 1
                elif len(parts) == num_cols + 1:
                    # Heuristic: Merge first two tokens? Or last two?
                    # Usually Patient ID is first.
                    # Lets try to see if merging first two makes sense? 
                    # For now, simplistic approach: drop extra tokens or skip.
                    # Better: Skip rigid check, try to aligning best effort.
                    # Just skip for safety to avoid misalignment.
                    pass
                
            if data:
                return pd.DataFrame(data)
                
    except Exception as e:
        print(f"Manual parsing failed: {e}")
        pass

    return None

def parse_docx_to_df(file_stream):
    """Parse a .docx file and return a DataFrame."""
    if not Document:
        raise ImportError("python-docx is not installed.")
    
    document = Document(file_stream)
    data = []
    
    # Strategy 1: Look for tables (most reliable for structured data)
    for table in document.tables:
        headers = []
        for i, row in enumerate(table.rows):
            row_data = [cell.text.strip() for cell in row.cells]
            if i == 0:
                headers = [h.lower() for h in row_data]
            else:
                # Create dict based on headers
                if len(row_data) == len(headers):
                    data.append(dict(zip(headers, row_data)))
    
    # If tables found, return DF
    if data:
        return pd.DataFrame(data)
        
    # Strategy 2: Look for tabular text in paragraphs (fallback for "Text Tables")
    full_text = '\n'.join([p.text for p in document.paragraphs])
    df_table = parse_text_table(full_text)
    if df_table is not None:
        return df_table

    # Strategy 3: Key-Value pairs (fallback)
    row_dict = {}
    for para in document.paragraphs:
        text = para.text.strip()
        if ':' in text:
            parts = text.split(':', 1)
            key = parts[0].strip().lower()
            val = parts[1].strip()
            row_dict[key] = val
    
    if row_dict:
        return pd.DataFrame([row_dict])
        
    return pd.DataFrame() # Empty if nothing found


def parse_doc_to_df(file_stream):
    """
    Attempt to parse legacy .doc files.
    """
    # 1. Try as docx first
    try:
        if Document:
            file_stream.seek(0)
            return parse_docx_to_df(file_stream)
    except Exception:
        pass # Not a valid docx
        
    # 2. Binary string extraction (Best effort for .doc)
    try:
        file_stream.seek(0)
        content = file_stream.read()
        # Decode with ignore to get printable strings
        text = content.decode('latin-1', errors='ignore')
        
        # Strategy A: Text Table
        df_table = parse_text_table(text)
        if df_table is not None:
            return df_table
            
        # Strategy B: Key-Value Regex (Legacy Fallback)
        # Look for keywords in the raw text
        row_dict = {}
        # Simple regex-like search for "Age... 60"
        import re
        
        # Define patterns for our fields
        patterns = {
            'age': [r'age.*?(\d+)', r'years.*?old.*?(\d+)'],
            'tremor_score': [r'tremor.*?(\d+(\.\d+)?)'],
            'handwriting_score': [r'handwriting.*?(\d+(\.\d+)?)', r'micrographia.*?(\d+(\.\d+)?)'],
            'jitter_local': [r'jitter.*?(\d+(\.\d+)?)'],
            'shimmer_local': [r'shimmer.*?(\d+(\.\d+)?)'],
            'bradykinesia': [r'bradykinesia.*?(\d+(\.\d+)?)'],
            'rigidity': [r'rigidity.*?(\d+(\.\d+)?)']
        }
        
        for field, regex_list in patterns.items():
            for regex in regex_list:
                match = re.search(regex, text, re.IGNORECASE)
                if match:
                    row_dict[field] = match.group(1)
                    break
        
        if row_dict:
            return pd.DataFrame([row_dict])
            
    except Exception as e:
        print(f"Doc parsing error: {e}")
        pass
        
    return pd.DataFrame()

def parse_pdf_to_df(file_stream):
    """Parse a .pdf file and return a DataFrame."""
    if not PdfReader:
        raise ImportError("pypdf is not installed.")
        
    reader = PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    # Strategy 1: Text Table (Generic whitespace separated)
    df_table = parse_text_table(text)
    if df_table is not None:
        return df_table

    # Strategy 2: Robust Key-Value Parsing (Fallback)
    import re
    row_dict = {}
    
    # Common patterns for medical reports
    # Age: 60, Age 60, 60 years old
    # Tremor: 1, Tremor Score: 1
    
    patterns = {
        'age': [r'age\s*[:=-]?\s*(\d+)', r'(\d+)\s*years\s*old'],
        'tremor_score': [r'tremor\s*(?:score)?\s*[:=-]?\s*(\d+(?:\.\d+)?)'],
        'handwriting_score': [r'handwriting\s*(?:score)?\s*[:=-]?\s*(\d+(?:\.\d+)?)', r'micrographia\s*[:=-]?\s*(\d+(?:\.\d+)?)'],
        'jitter_local': [r'jitter\s*(?:local)?\s*(?:\(abs\))?\s*[:=-]?\s*(\d+(?:\.\d+)?)'],
        'shimmer_local': [r'shimmer\s*(?:local)?\s*[:=-]?\s*(\d+(?:\.\d+)?)'],
        'bradykinesia': [r'bradykinesia\s*[:=-]?\s*(\d+(?:\.\d+)?)'],
        'rigidity': [r'rigidity\s*[:=-]?\s*(\d+(?:\.\d+)?)']
    }
    
    for field, regex_list in patterns.items():
        found = False
        for regex in regex_list:
            match = re.search(regex, text, re.IGNORECASE)
            if match:
                row_dict[field] = match.group(1)
                found = True
                break
                
    if row_dict:
        return pd.DataFrame([row_dict])
        
    return pd.DataFrame()

# Helper function for batch processing
def process_csv_batch(df, model_handler):
    results = []
    failed = 0
    successful = 0
    
    # Normalize column names for easier matching
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    def find_column(keywords, row):
        """Find value for a feature by searching for keywords in column names"""
        # 1. Try exact matches first
        for key in keywords:
            if key in row:
                val = row[key]
                # Clean value if it's a string
                if isinstance(val, str):
                   import re
                   val_clean = re.sub(r'[^\d.]', '', val)
                   try:
                       return float(val_clean)
                   except:
                       pass 
                return val
        
        # 2. Try partial matches (fuzzy)
        for col in row.index:
            for key in keywords:
                if key in col:
                     val = row[col]
                     if isinstance(val, str):
                        import re
                        val_clean = re.sub(r'[^\d.]', '', val)
                        try:
                            return float(val_clean)
                        except:
                            pass
                     return val
        return 0 # Default if not found

    for index, row in df.iterrows():
        try:
            # INTELLIGENT MAPPING: Expanded keywords based on user dataset
            jitter = find_column(['jitter_local', 'jitter_perc', 'jitter_abs', 'jitter', 'jit'], row)
            shimmer = find_column(['shimmer_local', 'shimmer_apq3', 'shimmer_apq5', 'shimmer', 'shim'], row)
            tremor = find_column(['tremor_score', 'tremor', 'tremor_frequency', 'tremor_f'], row)
            age = find_column(['age', 'patient_age', 'years'], row) or 60 
            
            # Map other user columns
            handwriting = find_column(['handwriting_score', 'handwriting', 'micrographia', 'handwriting_s'], row)
            bradykinesia = find_column(['bradykinesia', 'slowness', 'stroke_velocity', 'writing_speed', 'stroke_v', 'writing_s'], row)
            rigidity = find_column(['rigidity', 'stiffness', 'drawing_pressure', 'drawing_p', 'pen_lift'], row)

            # Ensure safe conversion to float
            def safe_float(v, default=0.0):
                try:
                    return float(v)
                except:
                    return default

            features = {
                'age': safe_float(age, 60),
                'tremor_score': safe_float(tremor),
                'handwriting_score': safe_float(handwriting),
                'jitter_local': safe_float(jitter),
                'shimmer_local': safe_float(shimmer),
                'bradykinesia': safe_float(bradykinesia),
                'rigidity': safe_float(rigidity)
            }
            
            # Run prediction
            pred = model_handler.predict_single(features)
            
            results.append({
                "row": index + 1,
                "input": features,
                "prediction": pred,
                "status": "success"
            })
            successful += 1
            
        except Exception as e:
            results.append({
                "row": index + 1,
                "error": str(e),
                "status": "failed"
            })
            failed += 1
            
    return {
        "predictions": results,
        "total_records": len(df),
        "successful_predictions": successful,
        "failed_predictions": failed
    }
