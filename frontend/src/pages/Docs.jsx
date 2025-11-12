
import React from 'react';

export default function Docs() {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-xl rounded-xl my-10">
      <h1 className="text-4xl font-extrabold text-blue-800 mb-6 border-b pb-2">
        Analyzer Documentation & Scoring Guide 💡
      </h1>

    
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-3">1. What is the Comment Analyzer?</h2>
        <p className="text-gray-700">
          The **AI Comment Analyzer** is a tool designed to help content creators and moderators quickly identify and manage **toxic or harmful comments** on Instagram Reels. It provides a detailed, multi-label breakdown of toxicity, enabling nuanced moderation decisions.
        </p>
      </section>

      
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-3">2. How Toxicity is Scored</h2>
        <p className="text-gray-700 mb-4">
          We utilize the <span className="font-semibold text-red-600">unitary/toxic-bert</span> model, trained on extensive Jigsaw data, to classify language. The scores returned are **probabilities (0.0 to 1.0)** indicating how likely a comment is to belong to a specific harmful category.
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
          <li>
            <span className="font-semibold">Toxicity (Overall):</span> The general probability that the comment is rude, disrespectful, or unreasonable.
          </li>
          <li>
            <span className="font-semibold text-blue-800">Action Threshold:</span> We recommend flagging or hiding comments with an Overall Toxicity score <span className="font-extrabold">greater than 60% (0.6)</span>.
          </li>
        </ul>
      </section>

     
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">3. Toxicity Breakdown Guide</h2>
        <p className="text-gray-700 mb-3">
          The detailed scores help you understand the specific nature of the toxic comment:
        </p>
        
        
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">Severe Toxic</td>
                <td className="px-6 py-4">Extremely hateful, aggressive, or likely to make a user leave the discussion. (e.g., Direct threats or explicit hate speech).</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">Insult</td>
                <td className="px-6 py-4">Profane or offensive language directed at a person's intelligence, appearance, or competence.</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">Threat</td>
                <td className="px-6 py-4">Suggesting violence or harm to a specific person or group.</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">Identity Attack</td>
                <td className="px-6 py-4">Negative comments targeting a person's race, religion, gender, or orientation.</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold">Obscene / Profanity</td>
                <td className="px-6 py-4">Language containing strong vulgarity or explicit terms.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}