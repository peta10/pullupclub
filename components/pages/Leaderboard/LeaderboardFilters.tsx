import React, { useState, useRef, useEffect } from 'react';
import { LeaderboardFilters as FiltersType } from '../../../types';
import badges, { getAgeGroups, getAllBadgesForFilters } from '../../../data/mockData';
import { useTranslation } from 'react-i18next';
import { useOrganizations } from '../../../hooks/useOrganizations';
import { ChevronDown } from 'lucide-react';

interface LeaderboardFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
}

// Custom dropdown component for organizations with scrolling
const OrganizationDropdown: React.FC<{
  value: string;
  onChange: (value: string) => void;
  organizations: string[];
  isLoading: boolean;
  placeholder: string;
  disabled?: boolean;
}> = ({ value, onChange, organizations, isLoading, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value ? (value === 'No Organization' ? 'Independent' : value) : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white text-left focus:outline-none focus:ring-2 focus:ring-[#9b9b6f] flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-white">
          {isLoading ? 'Loading clubs...' : displayValue}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && !isLoading && (
        <div 
          className="absolute z-50 w-full mt-1 bg-gray-950 border border-gray-800 rounded shadow-lg max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
          style={{ 
            scrollBehavior: 'smooth'
          }}
          onWheel={(e) => {
            // Allow scroll wheel to work inside the dropdown
            e.stopPropagation();
            const target = e.currentTarget;
            const { deltaY } = e;
            target.scrollTop += deltaY;
          }}
        >
          <div
            className="px-3 py-2 text-white hover:bg-gray-800 cursor-pointer"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            {placeholder}
          </div>
          {organizations.filter(org => org !== 'None' && org !== 'No Organization').map((org) => (
            <div
              key={org}
              className="px-3 py-2 text-white hover:bg-gray-800 cursor-pointer"
              onClick={() => {
                onChange(org);
                setIsOpen(false);
              }}
            >
              {org}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({ filters, onFilterChange }) => {
  const { t } = useTranslation('leaderboard');
  const { organizations, isLoading: organizationsLoading } = useOrganizations();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const allowedRegions = [
    'North America',
    'South America',
    'Europe',
    'Asia',
    'Middle East',
    'Africa',
    'Australia/Oceania'
  ];

  const pullUpRanges = [
    '0-9',
    '10-19',
    '20-29',
    '30-39',
    '40-49',
    '50+'
  ];

  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-white text-lg font-medium mb-4 md:mb-0">{t('filters.title')}</h3>
        <button onClick={clearFilters} className="text-sm text-[#9b9b6f] hover:text-[#7a7a58]">
          {t('filters.clear')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.pullUps')}</label>
          <select name="pullUpRange" value={filters.pullUpRange || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allPullUps')}</option>
            {pullUpRanges.map((range) => (
              <option key={range} value={range}>{range} Pull-Ups</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.club')}</label>
          <OrganizationDropdown
            value={filters.club || ''}
            onChange={(value) => onFilterChange({ ...filters, club: value })}
            organizations={organizations}
            isLoading={organizationsLoading}
            placeholder={t('filters.allClubs')}
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.region')}</label>
          <select name="region" value={filters.region || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allRegions')}</option>
            {allowedRegions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.ageGroup')}</label>
          <select name="ageGroup" value={filters.ageGroup || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allAges')}</option>
            {getAgeGroups().map((ageGroup) => (
              <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.gender')}</label>
          <select name="gender" value={filters.gender || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allGenders')}</option>
            <option value="Male">{t('filters.male')}</option>
            <option value="Female">{t('filters.female')}</option>
            <option value="Other">{t('filters.other')}</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">{t('filters.badge')}</label>
          <select name="badge" value={filters.badge || ''} onChange={handleChange} className="w-full bg-gray-950 border border-gray-800 rounded py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]">
            <option value="">{t('filters.allBadges')}</option>
            {getAllBadgesForFilters().map((badge: any) => (
              <option key={badge.id} value={badge.id}>{badge.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardFilters;