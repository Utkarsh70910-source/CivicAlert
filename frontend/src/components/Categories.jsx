/**
 * Categories Component
 * 
 * Showcases the four primary civic issue categories:
 * 1. Roads & Potholes
 * 2. Streetlights
 * 3. Garbage & Sanitation
 * 4. Water & Drainage
 * 
 * Uses clean, responsive inline SVG icons without external libraries.
 */
function Categories({ onOpenReportModal }) {
  // Array of civic categories to keep the code modular and easy to explain in a viva
  const categoriesData = [
    {
      id: 'roads',
      title: 'Roads & Potholes',
      colorClass: 'category-roads',
      badgeText: 'Road Safety',
      description:
        'Crater potholes, broken asphalt, sunken utility trenches, damaged speed breakers, and open manhole hazards that endanger motorists and pedestrians.',
      examples: ['Deep Potholes', 'Damaged Curbs', 'Missing Manholes', 'Asphalt Cracks'],
      icon: (
        /* Road / Danger cone inline SVG icon */
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
          {/* Road perspective lines */}
          <path d="M4 19L9 5" />
          <path d="M20 19L15 5" />
          {/* Road center dash marks */}
          <line x1="12" y1="7" x2="12" y2="9" />
          <line x1="12" y1="13" x2="12" y2="15" />
          {/* Warning triangle / hazard indicator */}
          <path d="M12 2L1 21h22L12 2z" strokeWidth="1.75" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      id: 'streetlights',
      title: 'Streetlights',
      colorClass: 'category-streetlights',
      badgeText: 'Public Lighting',
      description:
        'Burned-out bulbs, flickering lamps, broken lighting poles, and poorly lit residential lanes causing nighttime security and commuting hazards.',
      examples: ['Dead Streetlights', 'Flickering Lamps', 'Damaged Light Poles', 'Dark Lanes'],
      icon: (
        /* Streetlight / Light bulb inline SVG icon */
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
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" />
        </svg>
      ),
    },
    {
      id: 'garbage',
      title: 'Garbage & Sanitation',
      colorClass: 'category-garbage',
      badgeText: 'Cleanliness',
      description:
        'Overflowing public dumpsters, uncollected residential waste, open dumping in vacant lots, and unhygienic conditions posing public health risks.',
      examples: ['Dumpster Overflow', 'Uncollected Trash', 'Illegal Dumping', 'Debris on Sidewalk'],
      icon: (
        /* Trash / Sanitation bin inline SVG icon */
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
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      ),
    },
    {
      id: 'water',
      title: 'Water & Drainage',
      colorClass: 'category-water',
      badgeText: 'Water & Utilities',
      description:
        'Leaking clean water mains, choked storm water drains, monsoon water stagnation on roads, and sewage overflows requiring urgent municipal attention.',
      examples: ['Broken Water Pipe', 'Clogged Storm Drain', 'Street Waterlogging', 'Sewage Leak'],
      icon: (
        /* Water drop & pipeline inline SVG icon */
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
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        </svg>
      ),
    },
  ];

  return (
    <section id="categories" className="categories-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header text-center">
          <span className="section-subtitle">Issue Classification</span>
          <h2 className="section-title">Civic Issue Categories</h2>
          <p className="section-description">
            CivicAlert streamlines reporting across four major neighborhood issue categories.
            Select any category below to initiate a report or explore common civic concerns.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="categories-grid">
          {categoriesData.map((category) => (
            <article
              key={category.id}
              className={`category-card ${category.colorClass}`}
            >
              <div className="category-card-top">
                <div className="category-icon-wrapper">
                  {category.icon}
                </div>
                <span className="category-badge">{category.badgeText}</span>
              </div>

              <h3 className="category-title">{category.title}</h3>
              <p className="category-description">{category.description}</p>

              {/* Sample Tags List */}
              <div className="category-tags">
                {category.examples.map((example, index) => (
                  <span key={index} className="category-tag-item">
                    {example}
                  </span>
                ))}
              </div>

              <div className="category-card-footer">
                <button
                  type="button"
                  className="btn btn-outline category-action-btn"
                  onClick={() => onOpenReportModal(category.title)}
                  aria-label={`Report an issue in ${category.title}`}
                >
                  <span>Report in this Category</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
