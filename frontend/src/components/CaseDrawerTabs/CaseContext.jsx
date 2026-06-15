import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { edgeFetch, EDGE, supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const CaseContext = createContext();

export const useCaseContext = () => useContext(CaseContext);

export const CaseProvider = ({ children, caseData, onClose, onRefresh }) => {
  // We will move all state from CaseDrawer here later.
  
  return (
    <CaseContext.Provider value={{ caseData, onClose, onRefresh }}>
      {children}
    </CaseContext.Provider>
  );
};
