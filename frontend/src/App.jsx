import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import About from './components/About';
import Footer from './components/Footer';
import ReportModal from './components/ReportModal';
import './App.css';

/**
 * CivicAlert Main Application Component
 * 
 * Assembles the CivicAlert Homepage:
 * - Navbar: Navigation & quick report action
 * - Hero: Mission statement, primary CTA, and live preview card
 * - Categories: 4 key civic issue categories (Roads, Streetlights, Sanitation, Water)
 * - About: 3-step workflow & student capstone mission
 * - Footer: Links, categories summary, and copyright
 * - ReportModal: Interactive placeholder for the upcoming complaint submission system
 */
function App() {
  // State to control modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State to track which category was clicked (or general report)
  const [selectedCategory, setSelectedCategory] = useState(null);

  /**
   * Opens the placeholder report modal.
   * Can be invoked without arguments (from hero/navbar) or with a specific category name.
   */
  const handleOpenReportModal = (categoryName = null) => {
    setSelectedCategory(categoryName);
    setIsModalOpen(true);
  };

  /**
   * Closes the placeholder modal and resets selected category.
   */
  const handleCloseReportModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="app-layout">
      {/* 1. Navigation Bar */}
      <Navbar onOpenReportModal={() => handleOpenReportModal()} />

      {/* Main Content Area */}
      <main id="main-content">
        {/* 2. Hero Section */}
        <Hero onOpenReportModal={() => handleOpenReportModal()} />

        {/* 3. Four Civic Categories Section */}
        <Categories onOpenReportModal={handleOpenReportModal} />

        {/* 4. About & How it Works Section */}
        <About />
      </main>

      {/* 5. Footer */}
      <Footer />

      {/* 6. Placeholder Report Dialog */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={handleCloseReportModal}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}

export default App;
