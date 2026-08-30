import React from 'react';

export default function Appointments() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Appointments</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Calendar and scheduling management</p>
        <div className="mt-4">
          <div className="bg-gray-50 p-6 rounded text-center">
            <p className="text-4xl">📅</p>
            <p className="mt-2">Calendar view</p>
            <p className="text-sm text-gray-500">Create, edit, and manage appointments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
