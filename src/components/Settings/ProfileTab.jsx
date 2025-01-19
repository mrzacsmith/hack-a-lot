import { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const ProfileTab = () => {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [urlStatus, setUrlStatus] = useState({ isValid: false, isChecking: false });
  const [isDragging, setIsDragging] = useState(false);
  const [headerImageLoading, setHeaderImageLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    bio: '',
    location: '',
    personalWebsite: '',
    occupation: '',
    company: '',
    skills: [],
    yearsOfExperience: '',
    education: '',
    githubUsername: '',
    linkedinUsername: '',
    twitterUsername: '',
    youtubeUsername: '',
    customSocialLinks: [],
    projects: [],
    customProfileUrl: '',
    headerImageUrl: '',
    isProfilePublic: false,
    publicFields: {
      basic: true,
      professional: true,
      social: true,
      hackathons: true,
      projects: true,
    }
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().profile) {
          setProfile(prev => ({
            ...prev,
            ...userDoc.data().profile
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [auth.currentUser]);

  // Check if custom URL is unique
  const isCustomUrlUnique = async (url) => {
    if (!url) return true;

    try {
      const q = query(
        collection(db, 'users'),
        where('profile.customProfileUrl', '==', url)
      );
      const snapshot = await getDocs(q);
      return snapshot.empty ||
        (snapshot.size === 1 && snapshot.docs[0].id === auth.currentUser.uid);
    } catch (error) {
      console.error('Error checking URL uniqueness:', error);
      return false;
    }
  };

  // Handle URL change with 45-day restriction
  const canChangeUrl = () => {
    if (!profile.lastUrlChangeDate) return true;

    const lastChange = profile.lastUrlChangeDate.toDate();
    const daysSinceChange = (new Date() - lastChange) / (1000 * 60 * 60 * 24);
    return daysSinceChange >= 45;
  };

  // Add debounced URL check
  useEffect(() => {
    let timeoutId;
    const checkUrl = async () => {
      if (!profile.customProfileUrl) {
        setUrlStatus({ isValid: false, isChecking: false });
        return;
      }

      setUrlStatus(prev => ({ ...prev, isChecking: true }));

      // Validate URL format
      const urlRegex = /^[a-zA-Z0-9-_]+$/;
      if (!urlRegex.test(profile.customProfileUrl)) {
        setUrlStatus({ isValid: false, isChecking: false });
        return;
      }

      // Check uniqueness
      const isUnique = await isCustomUrlUnique(profile.customProfileUrl);
      setUrlStatus({ isValid: isUnique, isChecking: false });
    };

    if (profile.customProfileUrl) {
      timeoutId = setTimeout(checkUrl, 500); // Debounce for 500ms
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [profile.customProfileUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    // Validate custom URL if changed
    if (profile.customProfileUrl) {
      // Check if URL changed
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const currentUrl = userDoc.data()?.profile?.customProfileUrl;

      if (currentUrl !== profile.customProfileUrl) {
        // Validate URL format
        const urlRegex = /^[a-zA-Z0-9-_]+$/;
        if (!urlRegex.test(profile.customProfileUrl)) {
          toast.error('Custom URL can only contain letters, numbers, hyphens, and underscores');
          return;
        }

        // Check 45-day restriction
        if (!canChangeUrl()) {
          toast.error('You can only change your custom URL once every 45 days');
          return;
        }

        // Check uniqueness
        const isUnique = await isCustomUrlUnique(profile.customProfileUrl);
        if (!isUnique) {
          toast.error('This custom URL is already taken');
          return;
        }
      }
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        profile: {
          ...profile,
          lastUrlChangeDate: profile.customProfileUrl ? new Date() : null
        }
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const addCustomSocialLink = () => {
    setProfile(prev => ({
      ...prev,
      customSocialLinks: [
        ...(prev.customSocialLinks || []),
        { id: uuidv4(), platform: '', username: '' }
      ]
    }));
  };

  const removeCustomSocialLink = (id) => {
    setProfile(prev => ({
      ...prev,
      customSocialLinks: prev.customSocialLinks.filter(link => link.id !== id)
    }));
  };

  const updateCustomSocialLink = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      customSocialLinks: prev.customSocialLinks.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const addProject = () => {
    setProfile(prev => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { id: uuidv4(), description: '', url: '', repoUrl: '' }
      ]
    }));
  };

  const removeProject = (id) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }));
  };

  const updateProject = (id, field, value) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      )
    }));
  };

  const handleHeaderImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setHeaderImageLoading(true);
    try {
      const storageRef = ref(storage, `header-images/${auth.currentUser.uid}/${uuidv4()}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setProfile(prev => ({
        ...prev,
        headerImageUrl: downloadUrl
      }));

      // Update the profile in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        'profile.headerImageUrl': downloadUrl
      });

      toast.success('Header image updated successfully');
    } catch (error) {
      console.error('Error uploading header image:', error);
      toast.error('Failed to upload header image');
    } finally {
      setHeaderImageLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleHeaderImageUpload(file);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Image Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Profile Header Image</h3>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {headerImageLoading ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Uploading...</span>
            </div>
          ) : profile.headerImageUrl ? (
            <div className="space-y-4 w-full">
              <img
                src={profile.headerImageUrl}
                alt="Header"
                className="w-full h-32 object-cover rounded-md"
              />
              <p className="text-sm text-center text-gray-500">
                Drag and drop a new image to replace the current one
              </p>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-sm text-gray-600">
                Drag and drop an image here, or click to select
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleHeaderImageUpload(file);
              }
            }}
          />
        </div>
      </div>

      {/* Custom URL Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Custom Profile URL</h3>
        <div className="flex gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 shrink-0">sisubuild.com/profile/</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={profile.customProfileUrl || ''}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 20); // Limit to 20 chars
                    setProfile(prev => ({
                      ...prev,
                      customProfileUrl: value
                    }));
                  }}
                  required
                  minLength={1}
                  maxLength={20}
                  placeholder="your-custom-url"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:ring-2 sm:text-sm ${!profile.customProfileUrl
                    ? 'border-gray-300'
                    : urlStatus.isChecking
                      ? 'border-yellow-300 bg-yellow-50'
                      : urlStatus.isValid
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                />
                {urlStatus.isChecking && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {!urlStatus.isChecking && profile.customProfileUrl && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {urlStatus.isValid ? (
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
            {profile.customProfileUrl && (
              <div className="flex items-center space-x-2">
                <a
                  href={`/profile/${profile.customProfileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
                >
                  View your public profile
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Required, max 20 characters. Can only be changed once every 45 days. Use letters, numbers, hyphens, and underscores only.
            </p>
          </div>

          {/* Profile Image */}
          <div className="w-48 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
              {auth.currentUser?.photoURL ? (
                <img
                  src={auth.currentUser.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={profile.location || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={profile.personalWebsite || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, personalWebsite: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Professional Details Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Professional Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
            <input
              type="text"
              value={profile.occupation || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={profile.company || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={profile.skills?.join(', ') || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                skills: e.target.value.split(',').map(skill => skill.trim()).filter(Boolean)
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input
              type="number"
              value={profile.yearsOfExperience || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <input
              type="text"
              value={profile.education || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Social Links</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
            <input
              type="text"
              value={profile.githubUsername || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, githubUsername: e.target.value }))}
              placeholder="username"
              className="mt-0 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
            <input
              type="text"
              value={profile.linkedinUsername || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, linkedinUsername: e.target.value }))}
              placeholder="profile"
              className="mt-0 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
            <input
              type="text"
              value={profile.twitterUsername || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, twitterUsername: e.target.value }))}
              placeholder="user"
              className="mt-0 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
            <input
              type="text"
              value={profile.youtubeUsername || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, youtubeUsername: e.target.value }))}
              placeholder="channel"
              className="mt-0 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Custom Social Links */}
        {profile.customSocialLinks?.map(link => (
          <div key={link.id} className="flex items-start space-x-2">
            <div className="flex-grow space-y-2">
              <input
                type="text"
                value={link.platform}
                onChange={(e) => updateCustomSocialLink(link.id, 'platform', e.target.value)}
                placeholder="Platform name"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <input
                type="text"
                value={link.username}
                onChange={(e) => updateCustomSocialLink(link.id, 'username', e.target.value)}
                placeholder="Username or URL"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => removeCustomSocialLink(link.id)}
              className="mt-1 text-gray-400 hover:text-red-500"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addCustomSocialLink}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Social Link
        </button>
      </div>

      {/* Hackathons Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Hackathon History</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-md p-4 shadow-sm">
            <p className="text-sm text-gray-500 italic">
              Your completed hackathons will appear here automatically. They will be pulled from your participation history.
            </p>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Projects</h3>
        <div className="space-y-6">
          {profile.projects?.map(project => (
            <div key={project.id} className="bg-white rounded-md p-4 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-grow space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={project.description}
                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                      rows={2}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
                    <input
                      type="url"
                      value={project.url}
                      onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
                    <input
                      type="url"
                      value={project.repoUrl}
                      onChange={(e) => updateProject(project.id, 'repoUrl', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeProject(project.id)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addProject}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Project
          </button>
        </div>
      </div>

      {/* Privacy Settings Section */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={profile.isProfilePublic}
              onChange={(e) => setProfile(prev => ({ ...prev, isProfilePublic: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Make my profile public
            </label>
          </div>

          {profile.isProfilePublic && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.publicFields?.basic}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    publicFields: { ...prev.publicFields, basic: e.target.checked }
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Show basic information
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.publicFields?.professional}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    publicFields: { ...prev.publicFields, professional: e.target.checked }
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Show professional details
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.publicFields?.social}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    publicFields: { ...prev.publicFields, social: e.target.checked }
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Show social links
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.publicFields?.hackathons}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    publicFields: { ...prev.publicFields, hackathons: e.target.checked }
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Show hackathon history
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.publicFields?.projects}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    publicFields: { ...prev.publicFields, projects: e.target.checked }
                  }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Show projects
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default ProfileTab; 