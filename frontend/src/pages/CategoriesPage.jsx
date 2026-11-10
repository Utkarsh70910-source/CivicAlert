import { useState } from 'react';
import Categories from '../components/Categories';
import ReportModal from '../components/ReportModal';

/**
 * CategoriesPage Component
 * 
 * Standalone citizen categories route (/categories) displaying the 4 core civic issue
 * areas with interactive problem reporting triggers.
 */
function CategoriesPage() {
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
    <div className="portal-page-container">
      <div className="container">
        <Categories onOpenReportModal={handleOpenReportModal} />
        <ReportModal
          isOpen={isModalOpen}
          onClose={handleCloseReportModal}
          selectedCategory={selectedCategory}
        />
      </div>
    </div>
  );
}

export default CategoriesPage;

