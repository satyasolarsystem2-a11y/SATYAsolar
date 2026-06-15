export const STAGES = [
  { key: "Registration: Document Verification", label: "Registered", icon: "how_to_reg" },
  { key: "Bank & Finance", label: "Banking", icon: "account_balance" },
  { key: "Survey Completed", label: "Surveyed", icon: "map" },
  { key: "Design & BOM Approved", label: "Design", icon: "architecture" },
  { key: "Material Reserved", label: "Inventory", icon: "inventory_2" },
  { key: "Structure Installed", label: "Structure", icon: "foundation" },
  { key: "Full Installation Completed", label: "Installed", icon: "construction" },
  { key: "Net Metering Completed", label: "Net Meter", icon: "bolt" },
  { key: "Completed", label: "Completed", icon: "task_alt" },
];

export const stageIndex = (stage) => {
  const map = {
    "Registration Approved": 0,
    "Registration Pending": 0,
    "Registration: Document Verification": 0,
    "Registration: Government Portal": 0,
    "Registration: Payment Verification": 0,
    "Bank & Finance": 1,
    "Survey Completed": 2,
    "Design & BOM Approved": 3,
    "Material Reserved": 4,
    "Structure Installed": 5,
    "Full Installation Completed": 6,
    "Net Metering Completed": 7,
    "Payment Cleared": 7, // grouped roughly
    "Subsidy Closed": 7,  // grouped roughly
    Completed: 8,
    "Project Completed": 8,
  };
  return map[stage] ?? -1;
};

export const FEATURES = [
  {
    icon: "sync",
    title: "Live Updates",
    desc: "Real-time status updates as your project moves through each stage of installation.",
  },
  {
    icon: "shield",
    title: "Secure Access",
    desc: "Your personal data stays private. We only show progress — nothing sensitive.",
  },
  {
    icon: "bar_chart",
    title: "Full Visibility",
    desc: "View every milestone from registration to plant activation in one place.",
  },
];
