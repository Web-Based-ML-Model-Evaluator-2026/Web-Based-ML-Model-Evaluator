import io
import csv
import pandas as pd

# ReportLab imports for creating structured PDF documents
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class EvaluationReportGenerator:
    """
    Handles PDF and CSV evaluation report construction.
    Fulfills SRS ML-F-053:
      - Dataset details: total tuples (N), total columns (M), numerical feature means, and 10 sample tuples.
      - Training & Configuration: task type, target column, algorithm, and hyperparameters.
      - Evaluation Results: task-specific performance metrics (accuracy, precision, recall, F1, or MAE, RMSE, R2).
    """

    def __init__(self, project_data: dict, dataset_df: pd.DataFrame = None):
        """
        Initializes the generator with project configuration metadata and dataset records.
        If no DataFrame is supplied, a standard fallback tabular dataset is utilized.
        """
        self.project_data = project_data or {}

        # Ensure we always have tabular data to extract summary statistics and 10 tuples from
        if dataset_df is None or dataset_df.empty:
            self.df = pd.DataFrame({
                "feature_1": [12.4, 15.1, 10.9, 14.8, 16.2, 11.5, 13.7, 15.8, 14.2, 12.9, 16.5, 13.1],
                "feature_2": [0.45, 0.62, 0.38, 0.71, 0.82, 0.49, 0.55, 0.68, 0.74, 0.51, 0.85, 0.58],
                "feature_3": [105, 120, 98, 135, 142, 110, 118, 139, 125, 108, 145, 122],
                "target": [0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0]
            })
        else:
            self.df = dataset_df

    def compute_summary_statistics(self) -> dict:
        """
        Computes core tabular summaries required for reporting:
          - Total tuple count (N)
          - Total column count (M)
          - Numerical feature means
          - 10-tuple preview extracted directly from dataset rows
        """
        total_tuples = int(len(self.df))
        total_columns = int(len(self.df.columns))

        # Filter strictly numerical columns to calculate mathematical means safely
        numeric_cols = self.df.select_dtypes(include=["number"])
        means = {col: round(float(numeric_cols[col].mean()), 4) for col in numeric_cols.columns}

        # Extract exactly 10 sample tuples (rows) as requested
        sample_tuples = self.df.head(10).to_dict(orient="records")

        return {
            "total_tuples": total_tuples,
            "total_columns": total_columns,
            "means": means,
            "sample_tuples": sample_tuples,
            "columns": list(self.df.columns)
        }

    def generate_pdf(self) -> bytes:
        """
        Builds a styled PDF evaluation report using ReportLab Flowables.
        Returns the raw binary PDF stream ready for HTTP transmission.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Typography styling configurations
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            "ReportSubtitle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b")
        )
        h2_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontSize=11,
            leading=15,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=10,
            spaceAfter=4
        )
        cell_style = ParagraphStyle(
            "CellText",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#334155")
        )
        header_cell_style = ParagraphStyle(
            "HeaderCellText",
            parent=styles["Normal"],
            fontSize=8,
            leading=10,
            fontName="Helvetica-Bold",
            textColor=colors.white
        )

        elements = []
        stats = self.compute_summary_statistics()

        # Document Header
        elements.append(Paragraph("Web Based ML Model Evaluator - Evaluation Report", title_style))
        elements.append(Paragraph("SRS ML-F-053 Artifact Export | Model Verification & Telemetry Summary", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=8))

        # --- Section 1: Project & Configuration Metadata ---
        elements.append(Paragraph("1. Project & Model Configuration", h2_style))
        meta_table_data = [
            [Paragraph("Project ID", header_cell_style), Paragraph(str(self.project_data.get("project_id", "PRJ-PES-2026")), cell_style)],
            [Paragraph("Task Type", header_cell_style), Paragraph(str(self.project_data.get("task_type", "Classification")).capitalize(), cell_style)],
            [Paragraph("Target Column", header_cell_style), Paragraph(str(self.project_data.get("target_column", "target")), cell_style)],
            [Paragraph("Selected Model", header_cell_style), Paragraph(str(self.project_data.get("model_name", "Random Forest")), cell_style)],
            [Paragraph("Hyperparameters", header_cell_style), Paragraph(str(self.project_data.get("hyperparameters", {"n_estimators": 100})), cell_style)]
        ]
        meta_table = Table(meta_table_data, colWidths=[120, 420])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#334155")),
            ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#f8fafc")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 6))

        # --- Section 2: Dataset Summary & Statistical Highlights ---
        elements.append(Paragraph("2. Dataset Summary & Statistical Highlights", h2_style))
        overview_text = (
            f"<b>Total Tuples (N):</b> {stats['total_tuples']} &nbsp;&nbsp;|&nbsp;&nbsp; "
            f"<b>Total Columns (M):</b> {stats['total_columns']}"
        )
        elements.append(Paragraph(overview_text, cell_style))
        elements.append(Spacer(1, 3))

        # Feature Means Sub-Table
        means_table_data = [[Paragraph("Numerical Attribute", header_cell_style), Paragraph("Calculated Mean", header_cell_style)]]
        for feat, mean_val in stats["means"].items():
            means_table_data.append([
                Paragraph(str(feat), cell_style),
                Paragraph(str(mean_val), cell_style)
            ])
        means_table = Table(means_table_data, colWidths=[270, 270])
        means_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ]))
        elements.append(means_table)
        elements.append(Spacer(1, 6))

        # --- Section 3: First 10 Sample Tuples ---
        elements.append(Paragraph("3. Dataset Sample Preview (First 10 Tuples)", h2_style))
        # Keep up to 6 columns for clean landscape-to-portrait formatting
        sample_cols = stats["columns"][:6]
        col_width = 540 / len(sample_cols)
        sample_table_data = [[Paragraph(col, header_cell_style) for col in sample_cols]]
        
        for row in stats["sample_tuples"]:
            sample_table_data.append([Paragraph(str(row.get(col, "")), cell_style) for col in sample_cols])

        sample_table = Table(sample_table_data, colWidths=[col_width] * len(sample_cols))
        sample_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0284c7")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        elements.append(sample_table)
        elements.append(Spacer(1, 6))

        # --- Section 4: Performance Evaluation Metrics ---
        elements.append(Paragraph("4. Model Performance Evaluation Metrics", h2_style))
        metrics = self.project_data.get("metrics", {})
        metrics_table_data = [[Paragraph("Evaluation Metric", header_cell_style), Paragraph("Calculated Score", header_cell_style)]]
        
        for metric_name, val in metrics.items():
            formatted_val = f"{val:.4f}" if isinstance(val, (int, float)) else str(val)
            metrics_table_data.append([
                Paragraph(metric_name.replace("_", " ").title(), cell_style),
                Paragraph(formatted_val, cell_style)
            ])

        metrics_table = Table(metrics_table_data, colWidths=[270, 270])
        metrics_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16a34a")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(metrics_table)

        # Render document flow into memory
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_csv(self) -> str:
        """
        Constructs a structured multi-section CSV string.
        Includes project metadata, dataset dimensions, calculated means, 
        10 sample tuples, and model performance metrics.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        stats = self.compute_summary_statistics()

        # Section 1: Project Metadata
        writer.writerow(["# SECTION 1: PROJECT & MODEL METADATA"])
        writer.writerow(["Project ID", self.project_data.get("project_id", "PRJ-PES-2026")])
        writer.writerow(["Task Type", self.project_data.get("task_type", "classification")])
        writer.writerow(["Target Column", self.project_data.get("target_column", "target")])
        writer.writerow(["Selected Model", self.project_data.get("model_name", "Random Forest")])
        writer.writerow(["Hyperparameters", str(self.project_data.get("hyperparameters", {}))])
        writer.writerow([])

        # Section 2: Summary Stats & Means
        writer.writerow(["# SECTION 2: DATASET OVERVIEW & SUMMARY STATISTICS"])
        writer.writerow(["Total Tuples (N)", stats["total_tuples"]])
        writer.writerow(["Total Columns (M)", stats["total_columns"]])
        writer.writerow(["Attribute", "Calculated Mean"])
        for feat, mean_val in stats["means"].items():
            writer.writerow([feat, mean_val])
        writer.writerow([])

        # Section 3: 10 Tuples Sample Preview
        writer.writerow(["# SECTION 3: DATASET PREVIEW (FIRST 10 TUPLES)"])
        writer.writerow(stats["columns"])
        for row in stats["sample_tuples"]:
            writer.writerow([row.get(col, "") for col in stats["columns"]])
        writer.writerow([])

        # Section 4: Evaluation Results
        writer.writerow(["# SECTION 4: EVALUATION METRICS"])
        writer.writerow(["Metric", "Score"])
        for m, v in self.project_data.get("metrics", {}).items():
            writer.writerow([m, v])

        return output.getvalue()