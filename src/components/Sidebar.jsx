import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-20 shadow-sm">
      <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#2D6A4F] tracking-tight">Meal Swiper</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-5 py-3.5 rounded-xl font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#2D6A4F] text-white shadow-md'
                : 'text-[#1A1A1A] hover:bg-[#FAFAF8] hover:text-[#2D6A4F]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
