from .history_repository import HistoryRepository
class HistoryNotFoundError(Exception): pass
class HistoryService:
    def __init__(self, db_path): self.repo = HistoryRepository(db_path)
    def save(self, payload): return self.repo.create(payload)
    def list(self, limit=50, offset=0): return self.repo.list(limit, offset)
    def get(self, record_id):
        item = self.repo.get(record_id)
        if item is None: raise HistoryNotFoundError("Evaluation was not found.")
        return item
    def delete(self, record_id):
        if not self.repo.delete(record_id): raise HistoryNotFoundError("Evaluation was not found.")
