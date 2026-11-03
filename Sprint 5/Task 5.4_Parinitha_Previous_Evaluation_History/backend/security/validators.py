from pathlib import Path
from werkzeug.datastructures import FileStorage
MAX_BYTES = 5 * 1024 * 1024
def validate_history_payload(payload):
    errors = []
    if not isinstance(payload, dict): return ["Request body must be a JSON object."]
    if payload.get("task_type") not in {"classification","regression"}:
        errors.append("task_type must be classification or regression.")
    name = payload.get("model_name")
    if not isinstance(name,str) or not name.strip() or len(name) > 200:
        errors.append("model_name is required and must be at most 200 characters.")
    for field in ("project_id","dataset_name","summary"):
        value = payload.get(field)
        if value is not None and (not isinstance(value,str) or len(value)>200):
            errors.append(f"{field} must be a string of at most 200 characters.")
    metrics = payload.get("metrics")
    if not isinstance(metrics,dict) or not metrics or len(metrics)>30:
        errors.append("metrics must be a non-empty object with at most 30 entries.")
    elif any(not isinstance(k,str) or not k.strip() or not isinstance(v,(int,float)) or isinstance(v,bool) for k,v in metrics.items()):
        errors.append("Metric names must be non-empty and metric values must be numeric.")
    if not isinstance(payload.get("hyperparameters",{}),dict):
        errors.append("hyperparameters must be a JSON object.")
    return errors
def parse_pagination(args):
    try: limit, offset = int(args.get("limit",50)), int(args.get("offset",0))
    except (TypeError,ValueError): return None,"limit and offset must be integers."
    if not 1 <= limit <= 100: return None,"limit must be between 1 and 100."
    if offset < 0: return None,"offset must be zero or greater."
    return {"limit":limit,"offset":offset},None
def validate_csv_upload(upload):
    if not isinstance(upload,FileStorage) or not upload.filename: return False,"A CSV file is required."
    if Path(upload.filename).name != upload.filename or Path(upload.filename).suffix.lower() != ".csv":
        return False,"Only a simple .csv filename is allowed."
    pos = upload.stream.tell()
    raw = upload.stream.read(MAX_BYTES+1)
    upload.stream.seek(pos)
    if not raw: return False,"The uploaded file is empty."
    if len(raw)>MAX_BYTES: return False,"The uploaded file exceeds the 5 MB limit."
    try: raw.decode("utf-8-sig")
    except UnicodeDecodeError: return False,"The CSV must use UTF-8 text encoding."
    return True,""
