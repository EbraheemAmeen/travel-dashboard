'use client';

import React from 'react';
import { useParams } from 'next/navigation';

const EditCountry = () => {
  const params = useParams();
  const countryID = params.countryID; // or `params['countryID']`

  return (
    <main className="ml-[20%] p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">Edit Country: {countryID}</h1>
    </main>
  );
};

export default EditCountry;
