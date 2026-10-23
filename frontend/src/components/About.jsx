/**
 * About Component
 * 
 * Explains how CivicAlert works, how it helps everyday citizens report
 * and track civic problems, and provides background on the project mission.
 */
function About() {
  const workflowSteps = [
    {
      step: '01',
      title: 'Spot & Report',
      description:
        'Notice a civic breakdown in your neighborhood. Choose a category, specify the street or ward location, and provide details of the issue.',
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
    },
    {
      step: '02',
      title: 'Route to Authorities (Planned)',
      description:
        'In planned future phases, complaints will be automatically routed to the relevant municipal department or ward office for action.',
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      step: '03',
      title: 'Track to Resolution (Planned)',
      description:
        'Planned functionality to provide transparent status updates so residents can monitor progress from initial review to completion.',
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <section id="about" className="about-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header text-center">
          <span className="section-subtitle">Our Purpose</span>
          <h2 className="section-title">About CivicAlert</h2>
          <p className="section-description">
            CivicAlert is a student-built prototype designed to demonstrate how a community-first
            platform could bridge the gap between citizens and local governance through transparent reporting.
          </p>
        </div>

        {/* 3-Step Process Grid */}
        <div className="about-steps-grid">
          {workflowSteps.map((stepItem, index) => (
            <div key={index} className="about-step-card">
              <div className="step-number-tag">{stepItem.step}</div>
              <div className="step-icon-bubble">{stepItem.icon}</div>
              <h3 className="step-title">{stepItem.title}</h3>
              <p className="step-description">{stepItem.description}</p>
            </div>
          ))}
        </div>

        {/* Mission & College Project Callout Box */}
        <div className="about-callout-box">
          <div className="callout-icon">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="callout-text">
            <h4 className="callout-heading">A Student-Driven Civic Tech Initiative</h4>
            <p className="callout-p">
              CivicAlert is being built as a college capstone full-stack project. The vision is to replace
              cumbersome manual complaint processes with an intuitive digital portal. In upcoming phases,
              the platform will include photo uploads, location mapping, municipal admin dashboards,
              and real-time notification alerts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
