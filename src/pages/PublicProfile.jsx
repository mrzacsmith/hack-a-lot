import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const PublicProfile = () => {
  const { profileUrl } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Query for user with matching custom URL
        const q = query(
          collection(db, 'users'),
          where('profile.customProfileUrl', '==', profileUrl)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Profile not found');
          return;
        }

        const userData = snapshot.docs[0].data();

        // Check if profile is public
        if (!userData.profile?.isProfilePublic) {
          setError('This profile is private');
          return;
        }

        setProfile({
          ...userData,
          id: snapshot.docs[0].id
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <p className="text-gray-600">
            The profile you're looking for might be private or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const { publicFields = {} } = profile.profile || {};

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 bg-indigo-600">
            <div className="flex items-center">
              {profile.photoURL && (
                <img
                  src={profile.photoURL}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="h-16 w-16 rounded-full border-4 border-white mr-4"
                />
              )}
              <div>
                <h3 className="text-lg leading-6 font-medium text-white">
                  {profile.firstName} {profile.lastName}
                </h3>
                {publicFields.basic && profile.profile?.occupation && (
                  <p className="mt-1 text-sm text-indigo-100">
                    {profile.profile.occupation} {profile.profile?.company && `at ${profile.profile.company}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6 space-y-8">
            {/* Basic Information */}
            {publicFields.basic && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">About</h4>
                {profile.profile?.bio && (
                  <p className="text-gray-700">{profile.profile.bio}</p>
                )}
                {profile.profile?.location && (
                  <p className="text-sm text-gray-600">📍 {profile.profile.location}</p>
                )}
                {profile.profile?.personalWebsite && (
                  <a
                    href={profile.profile.personalWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    🌐 Personal Website
                  </a>
                )}
              </div>
            )}

            {/* Professional Details */}
            {publicFields.professional && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Professional Background</h4>
                {profile.profile?.skills?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {profile.profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.profile?.education && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Education</h5>
                    <p className="text-gray-600">{profile.profile.education}</p>
                  </div>
                )}
                {profile.profile?.yearsOfExperience && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Experience</h5>
                    <p className="text-gray-600">{profile.profile.yearsOfExperience} years</p>
                  </div>
                )}
              </div>
            )}

            {/* Social Links */}
            {publicFields.social && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Connect</h4>
                <div className="flex space-x-4">
                  {profile.profile?.githubUrl && (
                    <a
                      href={profile.profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                  {profile.profile?.linkedinUrl && (
                    <a
                      href={profile.profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}
                  {profile.profile?.twitterUrl && (
                    <a
                      href={profile.profile.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Hackathon History */}
            {publicFields.hackathons && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Hackathon History</h4>
                {/* TODO: Add hackathon history display */}
                <p className="text-gray-600">Coming soon</p>
              </div>
            )}

            {/* Projects */}
            {publicFields.projects && (
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Projects</h4>
                {/* TODO: Add projects display */}
                <p className="text-gray-600">Coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile; 