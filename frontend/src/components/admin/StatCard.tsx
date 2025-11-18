import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  borderColor: string;
}

export default function StatCard({ title, value, borderColor }: StatCardProps) {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg border-b-4 ${borderColor}`}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-extrabold mt-1 text-gray-900">{value}</p>
    </div>
  );
}
