import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getTeachers, registerProject, supabase } from '../../utils/api';
import { PROJECT_DOMAINS, PROJECT_TYPES, SDG_GOALS, PO_LIST, SEMESTERS, ACADEMIC_YEARS } from '../../utils/constants';
import { Check, XCircle, AlertCircle, Camera, X as XIcon } from 'lucide-react';

export default function RegisterProject() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Read from session storage if available
  const savedDraft = JSON.parse(sessionStorage.getItem('registerProjectDraft'));

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: savedDraft || {
      title: '', type: '', domain: '', description: '', github_link: '', linkedin_link: '',
      semester: '', academic_year: '', mentor_id: '',
      team_members: [{ name: '', rollNumber: '', rbtNumber: '' }],
      sdg_goals: [],
      pos: [],
      technologies: []
    }
  });

  const formValues = watch();

  // Save draft whenever form values change
  useEffect(() => {
    sessionStorage.setItem('registerProjectDraft', JSON.stringify(formValues));
  }, [formValues]);

  const { fields, append, remove } = useFieldArray({ control, name: 'team_members' });
  const [techInput, setTechInput] = useState('');
  const technologies = watch('technologies');

  // Screenshot state
  const [screenshots, setScreenshots] = useState([]);  // Array of { file, preview }
  const [screenshotError, setScreenshotError] = useState('');

  useEffect(() => {
    getTeachers().then(data => setTeachers(data));
  }, []);

  const handleAddTech = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = techInput.trim();
      if (val && !technologies.includes(val)) {
        setValue('technologies', [...technologies, val]);
        setTechInput('');
      }
    }
  };

  const removeTech = (tech) => {
    setValue('technologies', technologies.filter(t => t !== tech));
  };

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length + screenshots.length > 6) {
      setScreenshotError('You can upload a maximum of 6 screenshots.');
      return;
    }
    setScreenshotError('');
    const newEntries = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setScreenshots(prev => [...prev, ...newEntries]);
    // Reset the input so same file can be re-added after removal
    e.target.value = '';
  };

  const removeScreenshot = (idx) => {
    setScreenshots(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onSubmit = async (data) => {
    // Validate screenshots
    if (screenshots.length < 2) {
      setScreenshotError('Please upload at least two project screenshots.');
      return;
    }
    setScreenshotError('');
    setLoading(true);
    try {
      // Upload all screenshot images to Supabase storage
      toast.loading('Uploading screenshots...', { id: 'upload' });
      const uploadedUrls = [];
      for (const entry of screenshots) {
        const fileExt = entry.file.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('projects')
          .upload(fileName, entry.file, { contentType: entry.file.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('projects').getPublicUrl(uploadData.path);
        uploadedUrls.push(urlData.publicUrl);
      }

      toast.loading('Submitting project...', { id: 'upload' });
      const mentor = teachers.find(t => t.id === parseInt(data.mentor_id));

      await registerProject({
        title: data.title,
        type: data.type,
        domain: data.domain,
        description: data.description,
        technologies: data.technologies,
        sdg_goals: data.sdg_goals.map(Number),
        pos: data.pos,
        mentor_id: mentor.user_id,
        mentor_name: mentor.full_name,
        student_id: profile.user_id,
        semester: data.semester,
        academic_year: data.academic_year,
        github_link: data.github_link || null,
        linkedin_link: data.linkedin_link || null,
        screenshot_urls: uploadedUrls,
        team_members: data.team_members,
        status: 'Pending'
      });

      toast.success('Project submitted for approval!', { id: 'upload' });
      sessionStorage.removeItem('registerProjectDraft'); // Clear draft on success
      navigate('/student/dashboard');
    } catch (error) {
      toast.error(error.message, { id: 'upload' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
          {/* Global Error Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex flex-col gap-1 shadow-sm animate-in fade-in slide-in-from-top-2">
              <p className="font-bold flex items-center"><XCircle className="w-5 h-5 mr-2" /> Please fix the following errors before submitting:</p>
              <ul className="list-disc list-inside text-sm pl-2">
                {errors.title && <li>Project Title is required</li>}
                {errors.description && <li>Description must be at least 100 characters</li>}
                {errors.technologies && <li>Please add at least one technology</li>}
                {errors.mentor_id && <li>Please select a PBL Coordinator</li>}
                {screenshotError && <li>{screenshotError}</li>}
                {errors.type && <li>Project type is required</li>}
                {errors.domain && <li>Project domain is required</li>}
                {errors.semester && <li>Semester is required</li>}
                {errors.academic_year && <li>Academic year is required</li>}
              </ul>
            </div>
          )}
        
        {/* SECTION A - PROJECT INFORMATION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-brand-maroon px-6 py-4">
            <h2 className="text-lg font-bold text-white">A. Project Information</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
              <input {...register("title", { required: "Required" })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none" />
              {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Project</label>
                <div className="flex gap-4">
                  {PROJECT_TYPES.map(t => (
                    <label key={t} className="flex items-center text-sm text-gray-700">
                      <input type="radio" value={t} {...register("type", { required: "Required" })} className="mr-2" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Domain</label>
                <select {...register("domain", { required: "Required" })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white">
                  <option value="">Select Domain...</option>
                  {PROJECT_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select {...register("semester", { required: "Required" })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white">
                  <option value="">Select Semester...</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <select {...register("academic_year", { required: "Required" })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white">
                  <option value="">Select Year...</option>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
              <textarea {...register("description", { required: "Description is required", minLength: { value: 100, message: "Description must be at least 100 characters long" } })} rows={4} className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none" placeholder="Provide a detailed overview of your project goals, methodology, and expected outcomes..." />
              <p className={`text-xs mt-1 ${watch('description')?.length < 100 ? 'text-amber-600 font-semibold' : 'text-gray-500'} text-right`}>
                {watch('description')?.length || 0} characters (min 100)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub Repository Link (Optional)</label>
                <input type="url" {...register("github_link")} placeholder="https://github.com/your-username/repo" className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Post/Demo Link (Optional)</label>
                <input type="url" {...register("linkedin_link")} placeholder="https://linkedin.com/in/..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {technologies.map(t => (
                  <span key={t} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center">
                    {t} <button type="button" onClick={()=>removeTech(t)} className="ml-2 text-blue-600 hover:text-red-600">&times;</button>
                  </span>
                ))}
              </div>
              <input type="text" value={techInput} onChange={e=>setTechInput(e.target.value)} onKeyDown={handleAddTech} placeholder="Type and press Enter" className="w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none" />
              <input type="hidden" {...register("technologies", { validate: v => v.length > 0 || "Add at least one tech" })} />
            </div>
          </div>
        </div>

        {/* SECTION B - SDG GOALS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-brand-maroon px-6 py-4">
            <h2 className="text-lg font-bold text-white">B. UN Sustainable Development Goals Addressed</h2>
            <p className="text-red-100 text-sm">Select all goals your project addresses</p>
          </div>
          <div className="p-6">
            <Controller
              control={control}
              name="sdg_goals"
              render={({ field: { value, onChange } }) => (
                <>
                  <p className="mb-4 font-bold text-gray-700">{value.length} goals selected</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {SDG_GOALS.map(goal => {
                      const isSelected = value.includes(goal.id);
                      return (
                        <div
                          key={goal.id}
                          onClick={() => onChange(isSelected ? value.filter(v => v !== goal.id) : [...value, goal.id])}
                          className={`cursor-pointer rounded-lg p-3 h-24 flex flex-col justify-between transition border-2 ${isSelected ? 'border-transparent shadow-md' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
                          style={{ backgroundColor: isSelected ? goal.color : 'white' }}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-xl font-black ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{goal.id}</span>
                            {isSelected && <Check className="w-5 h-5 text-white" />}
                          </div>
                          <span className={`text-xs font-bold leading-tight ${isSelected?'text-white':'text-gray-700'}`}>{goal.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            />
          </div>
        </div>

        {/* SECTION C - PROGRAMME OUTCOMES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-brand-maroon px-6 py-4">
            <h2 className="text-lg font-bold text-white">C. Programme Outcomes Addressed</h2>
          </div>
          <div className="p-6">
            <Controller
              control={control}
              name="pos"
              render={({ field: { value, onChange } }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PO_LIST.map(po => {
                    const isSelected = value.includes(po.id);
                    return (
                      <div key={po.id} className={`flex items-start p-3 border rounded-lg transition overflow-hidden ${isSelected?'border-fuchsia-500 bg-fuchsia-50':'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          className="mt-1 mr-3 h-4 w-4 text-fuchsia-600 focus:ring-fuchsia-500 border-gray-300 rounded"
                          checked={isSelected}
                          onChange={(e) => onChange(e.target.checked ? [...value, po.id] : value.filter(v => v !== po.id))}
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{po.id}: {po.title}</p>
                          <p className="text-xs text-gray-500 leading-tight mt-1">{po.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            />
          </div>
        </div>

        {/* SECTION D - MENTOR */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">D. PBL Coordinator</h2>
          </div>
          <div className="p-6">
            <select {...register("mentor_id", { required: "Required" })} className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 outline-none bg-white">
              <option value="">Select PBL Coordinator...</option>
              {teachers.map(t => <option key={t.id} value={t.id}> {t.full_name} -- {t.department}</option>)}
            </select>
            {errors.mentor_id && <span className="text-red-500 text-xs mt-1 block">{errors.mentor_id.message}</span>}
          </div>
        </div>

        {/* SECTION E - TEAM MEMBERS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">E. Team Members</h2>
          </div>
          <div className="p-6 space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex flex-col md:flex-row gap-3 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Student Name</label>
                  <input {...register(`team_members.${index}.name`, { required: true })} className="w-full px-3 py-1.5 text-sm border rounded-md" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Roll Number</label>
                  <input {...register(`team_members.${index}.rollNumber`, { required: true })} className="w-full px-3 py-1.5 text-sm border rounded-md" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">RBT Number</label>
                  <input {...register(`team_members.${index}.rbtNumber`, { required: true })} className="w-full px-3 py-1.5 text-sm border rounded-md" />
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="px-3 py-1.5 bg-red-100 text-red-600 font-bold rounded-md hover:bg-red-200 w-full md:w-auto h-[34px]">
                    X remove
                  </button>
                )}
              </div>
            ))}
            {fields.length < 5 && (
              <button type="button" onClick={() => append({ name: '', rollNumber: '', rbtNumber: '' })} className="px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-lg hover:border-gray-400 hover:text-gray-800 transition">
                + Add Member
              </button>
            )}
          </div>
        </div>

        {/* SECTION F - PROJECT SCREENSHOTS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-brand-maroon px-6 py-4 border-b border-brand-maroon">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5" /> F. Upload Project Screenshots
            </h2>
            <p className="text-red-100 text-xs mt-1">Upload 2–6 screenshots (JPEG, PNG, WebP). These will be visible to your faculty mentor.</p>
          </div>
          <div className="p-6">
            {/* Upload Button */}
            <label
              htmlFor="screenshot-upload"
              className="flex items-center gap-2 w-fit cursor-pointer px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-700 font-semibold text-sm transition"
            >
              <Camera className="w-4 h-4" />
              {screenshots.length === 0 ? 'Choose Screenshots' : 'Add More'}
            </label>
            <input
              id="screenshot-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleScreenshotChange}
            />

            {/* Preview Grid */}
            {screenshots.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {screenshots.map((entry, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={entry.preview}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition shadow-lg"
                        title="Remove screenshot"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-1">
                      Screenshot {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {screenshotError && (
              <p className="mt-3 text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {screenshotError}
              </p>
            )}
            {screenshots.length < 2 && !screenshotError && (
              <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> At least 2 screenshots are required. Max 6 images, each up to 10MB.
              </p>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="text-center">
          <button type="submit" disabled={loading} className="w-full max-w-lg mx-auto py-4 bg-brand-maroon hover:bg-[#6e2e2e] text-white font-black text-lg rounded-xl shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Submitting...' : 'Submit Project for Approval'}
          </button>
        </div>
      </form>
    </div>
  </DashboardLayout>
  );
}
