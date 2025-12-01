import React from 'react';
import type { Property } from '../../types';
import { Users } from 'lucide-react';
import { IoTimeOutline, IoCheckmarkCircleOutline, IoLanguageOutline } from 'react-icons/io5';

interface HostSectionProps {
  property: Property;
}

const HostSection: React.FC<HostSectionProps> = ({ property }) => {
  const { host } = property;

  if (!host) {
    return (
      <section id="host" className="py-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Meet your host</h2>
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Host information will be displayed here</p>
        </div>
      </section>
    );
  }

  return (
    <section id="host" className="py-12">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Meet your host</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Host Profile Section */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {host.profileImage && host.profileImage.trim() ? (
                <img 
                  src={host.profileImage} 
                  alt={host.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#1a1a1a]/90">{host.name}</h3>
              <div className="flex flex-col space-y-1 text-sm text-gray-600 mt-1">
                <span>{host.type}</span>
                <span>Host since {host.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Host Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-6 rounded-xl">
            <div className="flex items-center space-x-3">
              <IoTimeOutline className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Response time</p>
                <p className="text-sm text-gray-600">{host.responseTime}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <IoCheckmarkCircleOutline className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Response rate</p>
                <p className="text-sm text-gray-600">{host.responseRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Host Details Section */}
        <div className="space-y-6">
          {/* Languages */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <IoLanguageOutline className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Languages</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {host.languages.map((language) => (
                <span 
                  key={language}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>

          {/* Verifications */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Verified</h4>
            <div className="flex flex-wrap gap-2">
              {host.verifications.map((verification) => (
                <span 
                  key={verification}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center space-x-1"
                >
                  <IoCheckmarkCircleOutline className="w-4 h-4" />
                  <span>{verification}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HostSection;
