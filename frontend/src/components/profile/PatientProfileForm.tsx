'use client';

import { useState } from 'react';
import { Patient } from '@/data/patients';
import BlackButton from '../buttons/BlackButton';

interface PatientProfileFormProps {
  patient?: Patient;
  onSubmit?: (patient: Patient) => void;
  isEditing?: boolean;
}

export default function PatientProfileForm({
  patient,
  onSubmit,
  isEditing = false,
}: PatientProfileFormProps) {
  const [formData, setFormData] = useState<Patient>(
    patient || {
      id: '',
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'other',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      bloodType: '',
      allergies: '',
      medications: '',
      medicalHistory: '',
      medicalDocuments: '',
      medicalReports: '',
      emergencyContactEmail: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      profileImage: '/images/user.png',
      lastUpdated: new Date().toISOString().split('T')[0],
    }
  );

  const [editMode, setEditMode] = useState(isEditing);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    setEditMode(false);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!editMode && patient) {
    return (
      <div className="w-full bg-white rounded-lg shadow-lg p-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b">
          <img
            src={formData.profileImage || '/images/user.png'}
            alt={formData.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{formData.name}</h1>
            <p className="text-gray-600">{formData.email}</p>
            <p className="text-sm text-gray-500">Last updated: {formData.lastUpdated}</p>
          </div>
          <button
            onClick={() => setEditMode(true)}
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Edit Profile
          </button>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-semibold text-gray-600">Phone</dt>
                <dd className="text-gray-900">{formData.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Date of Birth</dt>
                <dd className="text-gray-900">{formData.dateOfBirth}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Gender</dt>
                <dd className="text-gray-900 capitalize">{formData.gender}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Blood Type</dt>
                <dd className="text-gray-900">{formData.bloodType}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-semibold text-gray-600">Street Address</dt>
                <dd className="text-gray-900">{formData.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">City</dt>
                <dd className="text-gray-900">{formData.city}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Postal Code</dt>
                <dd className="text-gray-900">{formData.postalCode}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Country</dt>
                <dd className="text-gray-900">{formData.country}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Medical Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-semibold text-gray-600">Allergies</dt>
                <dd className="text-gray-900">{formData.allergies || 'None reported'}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Current Medications</dt>
                <dd className="text-gray-900">{formData.medications || 'None'}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Medical History</dt>
                <dd className="text-gray-900">{formData.medicalHistory || 'None reported'}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Contact</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-semibold text-gray-600">Name</dt>
                <dd className="text-gray-900">{formData.emergencyContactName}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Phone</dt>
                <dd className="text-gray-900">{formData.emergencyContactPhone}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-gray-600">Relation</dt>
                <dd className="text-gray-900">{formData.emergencyContactRelation}</dd>
              </div>
            </dl>
          </section>
        </div>


      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {patient ? 'Edit Profile' : 'Create Patient Profile'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image Upload */}
        <div className="flex items-center gap-6 pb-6 border-b">
          <div>
            <img
              src={formData.profileImage || '/images/user.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
        </div>

        {/* Personal Information */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Type</label>
              <input
                type="text"
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="O+"
              />
            </div>
          </div>
        </section>

        {/* Address Information */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="10001"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="United States"
              />
            </div>
          </div>
        </section>

        {/* Medical Information */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Medical Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="List any allergies separated by commas"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Medications
              </label>
              <textarea
                name="medications"
                value={formData.medications}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="List current medications separated by commas"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Describe any significant medical history"
              />
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="+1 (555) 123-4568"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Relation to Patient *
              </label>
              <input
                type="text"
                name="emergencyContactRelation"
                value={formData.emergencyContactRelation}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Spouse"
              />
            </div>
          </div>
        </section>



        {/* Form Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            {patient ? 'Update Profile' : 'Create Profile'}
          </button>
          {patient && editMode && (
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}