import { Link } from 'react-router-dom';

export default function AuthShell({ eyebrow, title, subtitle, children, footer, alternateLink, alternateText }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand-mark" aria-hidden="true">ML</div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {children}
        <div className="auth-footer">
          <span>{footer}</span>
          <Link to={alternateLink}>{alternateText}</Link>
        </div>
        <p className="project-label">Web-Based ML Model Evaluator</p>
      </section>
      <aside className="auth-aside" aria-label="Product introduction">
        <div className="aside-content">
          <span className="aside-tag">MODEL EVALUATION WORKSPACE</span>
          <h2>Build. Evaluate.<br /><span>Compare with clarity.</span></h2>
          <p>Sign in to continue to your model evaluation workspace.</p>
          <div className="mini-chart" aria-hidden="true">
            <div className="chart-line line-one" />
            <div className="chart-line line-two" />
            <div className="chart-line line-three" />
            <div className="chart-caption"><span>Evaluation workspace</span><span>● Ready when you are</span></div>
          </div>
        </div>
      </aside>
    </main>
  );
}
