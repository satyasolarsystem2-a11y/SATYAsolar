import React from "react";
import { F, S } from "./createCaseConstants";

const CustomerSection = ({ ctx }) => {
  const { f, set } = ctx;

  return (
    <div style={S.card}>
      <div style={S.sh}>
        <div style={S.shNum}>1</div>
        <div>Customer Information</div>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="Customer Name" req>
          <input
            style={S.inp}
            value={f.customerName}
            onChange={(e) => set("customerName", e.target.value)}
            required
            placeholder="e.g. Rahul Sharma"
          />
        </F>
        <F label="Mobile Number" req>
          <input
            style={S.inp}
            type="tel"
            value={f.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            required
            placeholder="10-digit number"
          />
        </F>
      </div>
      <div style={{ ...S.g2, marginBottom: 14 }}>
        <F label="Email ID" req>
          <input
            style={S.inp}
            type="email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            required
            placeholder="customer@email.com"
          />
        </F>
        <F label="Capacity (kW)" req>
          <input
            style={S.inp}
            type="number"
            value={f.electricalLoad}
            onChange={(e) => set("electricalLoad", e.target.value)}
            required
            placeholder="e.g. 5"
          />
        </F>
      </div>
      <div>
        <F label="Installation Address" req>
          <textarea
            style={{ ...S.inp, minHeight: "80px", resize: "vertical" }}
            value={f.address}
            onChange={(e) => set("address", e.target.value)}
            required
            placeholder="Full installation address"
          />
        </F>
      </div>
    </div>
  );
};

export default CustomerSection;
