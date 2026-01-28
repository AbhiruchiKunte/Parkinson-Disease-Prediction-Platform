
# Helper function for batch processing
def process_csv_batch(df, model_handler):
    results = []
    failed = 0
    successful = 0
    
    # Normalize column names for easier matching
    df.columns = [c.lower().strip() for c in df.columns]
    
    def find_column(keywords, row):
        """Find value for a feature by searching for keywords in column names"""
        # 1. Try exact matches first
        for key in keywords:
            if key in row:
                return row[key]
        
        # 2. Try partial matches (fuzzy)
        for col in row.index:
            for key in keywords:
                if key in col:
                    return row[col]
        return 0 # Default if not found

    for index, row in df.iterrows():
        try:
            # INTELLIGENT MAPPING: Search for columns using flexible keywords
            jitter = find_column(['jitter_local', 'jitter_perc', 'jitter_abs', 'jitter', 'jit'], row)
            shimmer = find_column(['shimmer_local', 'shimmer_apq3', 'shimmer_apq5', 'shimmer', 'shim'], row)
            tremor = find_column(['tremor_score', 'tremor'], row)
            age = find_column(['age', 'patient_age'], row) or 60 # Default age 60 if not found
            
            features = {
                'age': age,
                'tremor_score': tremor,
                'handwriting_score': find_column(['handwriting_score', 'handwriting', 'micrographia'], row),
                'jitter_local': jitter,
                'shimmer_local': shimmer,
                'bradykinesia': find_column(['bradykinesia', 'slowness'], row),
                'rigidity': find_column(['rigidity', 'stiffness'], row)
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
