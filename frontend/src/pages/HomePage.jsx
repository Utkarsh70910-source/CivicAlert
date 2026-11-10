import { useState } from 'react';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import About from '../components/About';
import ReportModal from '../components/ReportModal';

/**
 * HomePage Component
 * 
 * Public citizen landing page preserving the original visual design
 * and components: Hero, Categories, About, and interactive ReportModal.
 */
function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleOpenReportModal = (categoryName = null) => {
    setSelectedCategory(categoryName);
    setIsModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="home-page">
      <Hero onOpenReportModal={() => handleOpenReportModal()} />
      <Categories onOpenReportModal={handleOpenReportModal} />
      <About />
      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseReportModal}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}

export default HomePage;

