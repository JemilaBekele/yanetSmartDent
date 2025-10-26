import { useState } from 'react';

const CollapsibleSection = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggleCollapse}
        className="mt-4 text-blue-500"
      >
        {isCollapsed ? "Show Details" : "Hide Details"}
      </button>
      {!isCollapsed && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;