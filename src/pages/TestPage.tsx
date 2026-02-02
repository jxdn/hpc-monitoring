import React from 'react';

const TestPage = () => {
  return (
    <div className="p-10 bg-white min-h-screen">
      <h1 className="text-4xl font-bold text-purple-600 mb-4">Test Page - Working!</h1>
      <p className="text-gray-600 mb-6">If you can see this, Frontend is working properly.</p>
      
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="text-2xl font-bold mb-2">Gradient Card Test</h2>
        <p className="opacity-90">This card has a gradient background and should be visible.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-2 border-purple-500 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-purple-600">Card 1</h3>
          <p className="text-gray-600">Testing Tailwind classes</p>
        </div>
        <div className="bg-white border-2 border-blue-500 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-blue-600">Card 2</h3>
          <p className="text-gray-600">Testing Tailwind classes</p>
        </div>
        <div className="bg-white border-2 border-green-500 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-green-600">Card 3</h3>
          <p className="text-gray-600">Testing Tailwind classes</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-100 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Test Checklist:</h3>
        <ul className="text-gray-600 space-y-2 ml-6 list-disc">
          <li>✅ Can see this page</li>
          <li>✅ Purple gradient card visible</li>
          <li>✅ Three colored cards visible</li>
          <li>✅ Text is readable</li>
          <li>✅ Tailwind classes working</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;