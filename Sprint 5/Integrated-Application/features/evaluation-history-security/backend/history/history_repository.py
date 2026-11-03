import json
from backend.database import database_connection

def unpack(row):
    if row is None: return None
    result = dict(row)
    result["metrics"] = json.loads(result.pop("metrics_json"))
    result["hyperparameters"] = json.loads(result.pop("hyperparameters_json"))
    return result

class HistoryRepository:
    def __init__(self, db_path): self.db_path = db_path
    def create(self, data):
        with database_connection(self.db_path) as db:
            cur = db.execute("""INSERT INTO evaluation_history
            (project_id,task_type,dataset_name,model_name,metrics_json,hyperparameters_json,summary)
            VALUES (?,?,?,?,?,?,?)""",
            (data.get("project_id"), data["task_type"], data.get("dataset_name"),
             data["model_name"], json.dumps(data["metrics"]),
             json.dumps(data.get("hyperparameters", {})), data.get("summary")))
            new_id = cur.lastrowid
        return self.get(new_id)
    def get(self, record_id):
        with database_connection(self.db_path) as db:
            return unpack(db.execute("SELECT * FROM evaluation_history WHERE id=?", (record_id,)).fetchone())
    def list(self, limit=50, offset=0):
        with database_connection(self.db_path) as db:
            rows = db.execute("SELECT * FROM evaluation_history ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?", (limit,offset)).fetchall()
            return [unpack(row) for row in rows]
    def delete(self, record_id):
        with database_connection(self.db_path) as db:
            return db.execute("DELETE FROM evaluation_history WHERE id=?", (record_id,)).rowcount > 0
