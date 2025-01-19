import React from 'react';

const AboutSisu = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-400 to-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Understanding Sisu
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-indigo-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              The Finnish concept of extraordinary determination in the face of adversity
            </p>
          </div>
        </div>
      </div>

      {/* What is Sisu Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">What is Sisu?</h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Sisu is a Finnish concept that can be roughly translated as <strong>stoic determination</strong>, <strong>grit</strong>, <strong>resilience</strong>, and <strong>hardiness</strong>.
              It's about pushing through against all odds and taking action in the face of adversity.
            </p>
          </div>

          <div className="mt-12">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="ml-4 text-lg font-medium text-gray-900">Inner Strength</h3>
                </div>
                <p className="text-gray-500">
                  Sisu is about finding strength when you feel you have none left. It's the ability to push through
                  mental and physical barriers when logic says you should give up.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="ml-4 text-lg font-medium text-gray-900">Perseverance</h3>
                </div>
                <p className="text-gray-500">
                  More than just persistence, Sisu is about taking action against the odds and displaying courage
                  in the face of overwhelming obstacles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Examples Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Modern Examples of Sisu</h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Sisu manifests in various ways in modern life, from entrepreneurship to personal challenges.
              These individuals demonstrate that Sisu isn't just about personal achievement – it's about
              maintaining unwavering determination in the face of seemingly insurmountable challenges.
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Entrepreneurs and Innovators</h3>
              <div className="prose prose-indigo max-w-none">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Modern entrepreneurs embody Sisu when they persist through multiple failures, pivot their
                  businesses in challenging times, and continue pushing forward despite setbacks. Consider these examples:
                </p>
                <ul className="list-disc pl-6 space-y-4 text-gray-600">
                  <li>
                    <strong>Sara Blakely</strong> faced rejection after rejection while developing Spanx,
                    working as a fax machine saleswoman by day and spending nights and weekends perfecting her product.
                  </li>
                  <li>
                    <strong>James Dyson</strong> created 5,126 failed prototypes before finally succeeding
                    with his bagless vacuum cleaner.
                  </li>
                  <li>
                    <strong>Reid Hoffman's</strong> journey with LinkedIn began after his first social network,
                    SocialNet, struggled - demonstrating that persistence through failure often leads to greater success.
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Athletes and Competitors</h3>
              <div className="prose prose-indigo max-w-none">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Athletes who overcome injuries, setbacks, and fierce competition demonstrate Sisu.
                  Here are inspiring examples:
                </p>
                <ul className="list-disc pl-6 space-y-4 text-gray-600">
                  <li>
                    <strong>Bethany Hamilton</strong> returned to professional surfing just one month after
                    losing her arm in a shark attack, going on to win multiple championships.
                  </li>
                  <li>
                    <strong>Diana Nyad</strong> exemplified extraordinary Sisu when, after four failed attempts
                    and at age 64, she finally completed her swim from Cuba to Florida, battling jellyfish,
                    sharks, and extreme exhaustion for 53 hours.
                  </li>
                  <li>
                    <strong>Kyle Maynard</strong>, born with congenital amputation that left him with no arms
                    or legs, became a champion wrestler and the first quadruple amputee to climb Mount
                    Kilimanjaro without prosthetics.
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Social Innovators</h3>
              <div className="prose prose-indigo max-w-none">
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Those who work tirelessly for social change, often against significant opposition and with
                  limited resources, show Sisu in their unwavering commitment:
                </p>
                <ul className="list-disc pl-6 space-y-4 text-gray-600">
                  <li>
                    <strong>Malala Yousafzai</strong> continued advocating for girls' education even after
                    surviving an assassination attempt.
                  </li>
                  <li>
                    <strong>Bryan Stevenson</strong>, founder of the Equal Justice Initiative, has spent
                    decades fighting for wrongly condemned prisoners on death row, often facing intense
                    opposition and systemic barriers.
                  </li>
                  <li>
                    <strong>Dr. Paul Farmer</strong> dedicated his life to providing healthcare in impoverished
                    areas, building Partners in Health from a single clinic in Haiti to a global organization,
                    often walking hours through mountains to reach patients.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Find Your Sisu</h2>
            <p className="mt-4 text-xl text-gray-500">
              Join our community and discover your own extraordinary determination through innovation and creation.
            </p>
            <div className="mt-8">
              <a
                href="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Building Today
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSisu; 