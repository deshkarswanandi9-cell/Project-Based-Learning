import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { PROJECT_TYPES, DOMAINS, SDG_GOALS, PROGRAMME_OUTCOMES, ACADEMIC_YEARS } from '../../utils/constants';
import { Target, ImagePlus, Plus, Trash2, X, CheckCircle2 } from 'lucide-react';

export default function ProjectForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState([]); // array of File objects
  const [screenshotPreviews, setScreenshotPreviews] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      team_members: [{ name: '', usn: '', role: '' }],
      academic_year: '',
      hackathon_position: '',
      hackathon_other_position: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'team_members' });

  const selectedSDGs = watch('sdg_goals') || [];

  useEffect(() => { fetchTeachers(); }, []);

  const fetchTeachers = async () => {
    try {
      const data = await api.getAllTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSDGToggle = (id) => {
    const current = new Set(selectedSDGs);
    if (current.has(id.toString())) current.delete(id.toString());
    else current.add(id.toString());
    setValue('sdg_goals', Array.from(current));
  };

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (screenshots.length + validFiles.length > 5) {
      setErrorMsg('You can upload a maximum of 5 screenshots.');
      return;
    }
    const newFiles = [...screenshots, ...validFiles];
    setScreenshots(newFiles);
    const previews = newFiles.map(f => URL.createObjectURL(f));
    setScreenshotPreviews(previews);
  };

  const removeScreenshot = (index) => {
    const updated = screenshots.filter((_, i) => i !== index);
    setScreenshots(updated);
    setScreenshotPreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const onSubmit = async (data) => {
    if (screenshots.length === 0) {
      setErrorMsg('Please upload at least one project screenshot.');
      return;
    }
    if (selectedSDGs.length === 0) {
      setErrorMsg('Please select at least one SDG Goal.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Upload all screenshots and collect URLs
      const screenshotUrls = [];
      for (const file of screenshots) {
        const ext = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('projects')
          .upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('projects').getPublicUrl(fileName);
        screenshotUrls.push(urlData.publicUrl);
      }

      // 2. Prepare project data
      const mentor = teachers.find(t => t.id.toString() === data.mentor_id);

      let finalType = data.type;
      if (data.type === 'Hackathon') {
        const posText = data.hackathon_position === 'Other'
          ? (data.hackathon_other_position?.trim() || 'Other')
          : data.hackathon_position;
        finalType = posText ? `Hackathon (${posText})` : 'Hackathon';
      }

      const projectData = {
        title: data.title,
        type: finalType,
        domain: data.domain,
        description: data.description,
        technologies: data.technologies.split(',').map(t => t.trim()).filter(t => t),
        sdg_goals: data.sdg_goals,
        pos: data.pos || [],
        mentor_id: data.mentor_id,
        mentor_name: mentor?.full_name,
        student_id: user.id,
        // Store screenshots array as document_url (first) + screenshot_urls (all)
        document_url: screenshotUrls[0] || '',
        screenshot_urls: screenshotUrls,
        academic_year: data.academic_year,
        status: 'Pending',
        team_members: data.team_members,
      };

      await api.registerProject(projectData);
      navigate('/student');
    } catch (error) {
      setErrorMsg(error.message || 'Error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Register New Project
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Please fill out all sections carefully before submitting.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-2">
            <X className="w-4 h-4 mt-0.5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* SECTION A: Project Info */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-bold flex items-center justify-center">A</span>
              Project Details
            </h3>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Title</label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Type</label>
                <select
                  {...register('type', { required: 'Type is required' })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.type && <span className="text-red-500 text-xs">{errors.type.message}</span>}

                {watch('type') === 'Hackathon' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                      Position Secured <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {['1st', '2nd', '3rd', 'Other'].map(pos => (
                        <label key={pos} className="flex items-center text-sm font-medium text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            value={pos}
                            {...register("hackathon_position", {
                              validate: (v) => {
                                if (watch('type') === 'Hackathon' && !v) {
                                  return 'Please select a position';
                                }
                                return true;
                              }
                            })}
                            className="mr-1.5"
                          />
                          {pos}
                        </label>
                      ))}
                    </div>

                    {watch('hackathon_position') === 'Other' && (
                      <div className="mt-2.5">
                        <input
                          type="text"
                          {...register("hackathon_other_position", {
                            validate: (v) => {
                              if (watch('type') === 'Hackathon' && watch('hackathon_position') === 'Other' && (!v || !v.trim())) {
                                return 'Please type your position';
                              }
                              return true;
                            }
                          })}
                          placeholder="Type position / award"
                          className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {errors.hackathon_other_position && (
                          <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_other_position.message}</span>
                        )}
                      </div>
                    )}

                    {errors.hackathon_position && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_position.message}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Domain Area</label>
                <select
                  {...register('domain', { required: 'Domain is required' })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.domain && <span className="text-red-500 text-xs">{errors.domain.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                <select
                  {...register('academic_year', { required: 'Academic year is required' })}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select...</option>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.academic_year && <span className="text-red-500 text-xs">{errors.academic_year.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Detailed Description</label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Explain the problem statement and proposed solution..."
              />
              {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Technologies (Comma separated)</label>
              <input
                {...register('technologies', { required: 'Technologies are required' })}
                type="text"
                placeholder="React, Node.js, Python, Supabase"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.technologies && <span className="text-red-500 text-xs">{errors.technologies.message}</span>}
            </div>
          </div>
        </div>

        {/* SECTION B: SDG Goals */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-green-600 text-white rounded-full text-sm font-bold flex items-center justify-center">B</span>
              SDG Goals Alignment
            </h3>
            <p className="text-sm text-gray-500 mt-1">Select the sustainable development goals your project addresses.</p>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SDG_GOALS.map((goal) => {
                const isSelected = selectedSDGs.includes(goal.id.toString());
                return (
                  <button
                    type="button"
                    key={goal.id}
                    onClick={() => handleSDGToggle(goal.id)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-transparent text-white shadow-md scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={isSelected ? { backgroundColor: goal.color } : {}}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-lg font-extrabold shrink-0 ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                        {goal.id}
                      </span>
                      <div>
                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {goal.title}
                        </div>
                        <div className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          {goal.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-white/80" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION C: Programme Outcomes */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-purple-600 text-white rounded-full text-sm font-bold flex items-center justify-center">C</span>
              Programme Outcomes
            </h3>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROGRAMME_OUTCOMES.map((po) => (
                <div key={po.id} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`po-${po.id}`}
                      type="checkbox"
                      value={po.id}
                      {...register('pos')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`po-${po.id}`} className="font-medium text-gray-700">{po.id}</label>
                    <p className="text-gray-500 text-xs">{po.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION D: Mentor Selection */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-amber-500 text-white rounded-full text-sm font-bold flex items-center justify-center">D</span>
              Mentor Selection
            </h3>
          </div>
          <div className="px-6 py-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Teacher/Mentor</label>
            <select
              {...register('mentor_id', { required: 'Mentor selection is required' })}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select Mentor...</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.department})</option>
              ))}
            </select>
            {errors.mentor_id && <span className="text-red-500 text-xs">{errors.mentor_id.message}</span>}
          </div>
        </div>

        {/* SECTION E: Team Members */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-pink-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-rose-500 text-white rounded-full text-sm font-bold flex items-center justify-center">E</span>
              Team Members
            </h3>
            <button
              type="button"
              onClick={() => { if (fields.length < 5) append({ name: '', usn: '', role: '' }); }}
              disabled={fields.length >= 5}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </button>
          </div>
          <div className="px-6 py-6 space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      {...register(`team_members.${index}.name`, { required: true })}
                      placeholder="Full Name"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      {...register(`team_members.${index}.usn`, { required: true })}
                      placeholder="Library/Roll Number"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      {...register(`team_members.${index}.role`, { required: true })}
                      placeholder="Role (e.g. Lead)"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION F: Project Screenshots Upload */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-cyan-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-sky-500 text-white rounded-full text-sm font-bold flex items-center justify-center">F</span>
              Project Screenshots
            </h3>
            <p className="text-sm text-gray-500 mt-1">Upload up to 5 screenshots of your project (images only).</p>
          </div>
          <div className="px-6 py-6">
            {/* Preview grid */}
            {screenshotPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {screenshotPreviews.map((src, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-video">
                    <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            {screenshots.length < 5 && (
              <label
                htmlFor="screenshot-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition group"
              >
                <ImagePlus className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition mb-2" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                  Click to upload screenshots
                </span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — up to 5 images</span>
                <input
                  id="screenshot-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotChange}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12 gap-4">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="bg-white py-3 px-6 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Register Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
