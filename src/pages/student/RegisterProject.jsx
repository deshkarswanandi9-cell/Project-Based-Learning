import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getTeachers, registerProject, supabase } from '../../utils/api';
import { PROJECT_DOMAINS, PROJECT_TYPES, SDG_GOALS, PO_LIST, SEMESTERS, ACADEMIC_YEARS } from '../../utils/constants';
import { Check, XCircle, AlertCircle, Camera, X as XIcon, Award, Paperclip, FileText } from 'lucide-react';

export default function RegisterProject() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Read from session storage if available
  const savedDraft = JSON.parse(sessionStorage.getItem('registerProjectDraft'));

  let initialType = savedDraft?.type || '';
  let initialHackathonPos = savedDraft?.hackathon_position || '';
  let initialOtherPos = savedDraft?.hackathon_other_position || '';

  if (initialType.startsWith('Hackathon')) {
    const match = initialType.match(/^Hackathon\s*\((.*)\)$/);
    if (match) {
      initialType = 'Hackathon';
      const extracted = match[1];
      if (['1st', '2nd', '3rd'].includes(extracted)) {
        initialHackathonPos = initialHackathonPos || extracted;
      } else {
        initialHackathonPos = initialHackathonPos || 'Other';
        initialOtherPos = initialOtherPos || extracted;
      }
    }
  } else if (initialType === 'Mini') {
    initialType = 'Mini Project';
  } else if (initialType === 'Industry') {
    initialType = 'Industry Sponsored';
  }

  const defaultFormValues = {
    title: '', domain: '', description: '', github_link: '', linkedin_link: '',
    semester: '', academic_year: '', mentor_id: '',
    team_members: [{ name: '', rollNumber: '', rbtNumber: '' }],
    sdg_goals: [],
    pos: [],
    technologies: [],
    ...(savedDraft || {}),
    type: initialType || savedDraft?.type || '',
    hackathon_position: initialHackathonPos || savedDraft?.hackathon_position || '',
    hackathon_other_position: initialOtherPos || savedDraft?.hackathon_other_position || ''
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: defaultFormValues
  });

  const formValues = watch();
  const selectedType = watch('type');
  const selectedHackathonPos = watch('hackathon_position');

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

  // Hackathon certificate / proof state
  const [certificateFile, setCertificateFile] = useState(null); // { file, preview, name, size, isPdf }
  const [certificateError, setCertificateError] = useState('');

  useEffect(() => {
    getTeachers()
      .then(data => {
        if (data && data.length > 0) {
          setTeachers(data);
        } else {
          setTeachers([
            { id: 1, user_id: 't1', full_name: 'Dr. S. K. Patil', department: 'Computer Engineering' },
            { id: 2, user_id: 't2', full_name: 'Prof. A. R. Kulkarni', department: 'Computer Engineering' },
            { id: 3, user_id: 't3', full_name: 'Dr. M. N. Rao', department: 'Information Technology' },
          ]);
        }
      })
      .catch(() => {
        setTeachers([
          { id: 1, user_id: 't1', full_name: 'Dr. S. K. Patil', department: 'Computer Engineering' },
          { id: 2, user_id: 't2', full_name: 'Prof. A. R. Kulkarni', department: 'Computer Engineering' },
        ]);
      });
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

  const handleCertificateChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setCertificateError('Please upload a PDF or an image (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCertificateError('File size exceeds the 10MB limit.');
      return;
    }

    setCertificateError('');
    const isPdf = file.type === 'application/pdf';
    setCertificateFile({
      file,
      preview: isPdf ? null : URL.createObjectURL(file),
      name: file.name,
      size: file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isPdf
    });
    e.target.value = '';
  };

  const removeCertificate = () => {
    if (certificateFile?.preview) {
      URL.revokeObjectURL(certificateFile.preview);
    }
    setCertificateFile(null);
    if (watch('type') === 'Hackathon') {
      setCertificateError('Please attach a proof / certificate for the Hackathon.');
    } else {
      setCertificateError('');
    }
  };

  useEffect(() => {
    if (selectedType !== 'Hackathon') {
      if (certificateError) setCertificateError('');
      setValue('hackathon_position', '');
      setValue('hackathon_other_position', '');
      setCertificateFile(null);
    }
  }, [selectedType, certificateError, setValue]);

  const onSubmit = async (data) => {
    // Validate Hackathon certificate
    if (data.type === 'Hackathon' && !certificateFile) {
      setCertificateError('Please attach a proof / certificate for the Hackathon.');
      return;
    }
    setCertificateError('');

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
        // Store the bucket-relative object path for secure private viewing
        uploadedUrls.push(uploadData.path || fileName);
      }

      // Upload Hackathon Certificate if attached
      let uploadedCertificateUrl = null;
      if (data.type === 'Hackathon' && certificateFile?.file) {
        toast.loading('Uploading certificate proof...', { id: 'upload' });
        const certExt = certificateFile.file.name.split('.').pop();
        const certFileName = `cert-${profile.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${certExt}`;
        const { data: certUploadData, error: certUploadError } = await supabase.storage
          .from('projects')
          .upload(certFileName, certificateFile.file, { contentType: certificateFile.file.type });
        if (certUploadError) throw certUploadError;
        // Store bucket-relative path for certificate
        uploadedCertificateUrl = certUploadData.path || certFileName;
      }

      toast.loading('Submitting project...', { id: 'upload' });
      const mentor = teachers.find(t => t.id === parseInt(data.mentor_id)) || { user_id: 'mentor_default', full_name: 'PBL Coordinator' };

      let finalType = data.type;
      if (data.type === 'Hackathon') {
        const posText = data.hackathon_position === 'Other'
          ? (data.hackathon_other_position?.trim() || 'Other')
          : data.hackathon_position;
        finalType = posText ? `Hackathon (${posText})` : 'Hackathon';
      }

      await registerProject({
        title: data.title,
        type: finalType,
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
        document_url: uploadedCertificateUrl,
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
      <div className="w-full mx-auto py-3 sm:py-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
          {/* Global Error Summary */}
          {(Object.keys(errors).length > 0 || screenshotError || (selectedType === 'Hackathon' && certificateError)) && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-md flex flex-col gap-1 shadow-2xs animate-in fade-in slide-in-from-top-2">
              <p className="font-semibold text-xs flex items-center"><XCircle className="w-4 h-4 mr-1.5 shrink-0" /> Please fix the following errors before submitting:</p>
              <ul className="list-disc list-inside text-xs pl-2 space-y-0.5">
                {errors.title && <li>Project Title is required</li>}
                {errors.description && <li>Description must be at least 100 characters</li>}
                {errors.technologies && <li>Please add at least one technology</li>}
                {errors.mentor_id && <li>Please select a PBL Coordinator</li>}
                {screenshotError && <li>{screenshotError}</li>}
                {selectedType === 'Hackathon' && certificateError && <li>{certificateError}</li>}
                {errors.type && <li>Project type is required</li>}
                {errors.hackathon_position && <li>{errors.hackathon_position.message}</li>}
                {errors.hackathon_other_position && <li>{errors.hackathon_other_position.message}</li>}
                {errors.domain && <li>Project domain is required</li>}
                {errors.semester && <li>Semester is required</li>}
                {errors.academic_year && <li>Academic year is required</li>}
              </ul>
            </div>
          )}
        
        {/* SECTION A - PROJECT INFORMATION */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white tracking-wide">A. Project Information</h2>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Title</label>
              <input {...register("title", { required: "Required" })} className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800" />
              {errors.title && <span className="text-red-500 text-xs mt-0.5 block">{errors.title.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type of Project</label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                  {PROJECT_TYPES.map(t => (
                    <label key={t} className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        value={t}
                        {...register("type", { required: "Project type is required" })}
                        className="mr-2 text-brand-maroon focus:ring-brand-maroon"
                      />
                      {t}
                    </label>
                  ))}
                </div>
                {errors.type && <span className="text-red-500 text-xs mt-1 block">{errors.type.message}</span>}

                {/* Hackathon Position Selection */}
                {selectedType === 'Hackathon' && (
                  <div className="mt-3.5 p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                      Position Secured <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-4">
                      {[
                        { label: '1st', value: '1st' },
                        { label: '2nd', value: '2nd' },
                        { label: '3rd', value: '3rd' },
                        { label: 'Other', value: 'Other' }
                      ].map(pos => (
                        <label key={pos.value} className="flex items-center text-sm font-medium text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            value={pos.value}
                            {...register("hackathon_position", {
                              validate: (v) => {
                                if (watch('type') === 'Hackathon' && !v) {
                                  return 'Please select your position in the Hackathon';
                                }
                                return true;
                              }
                            })}
                            className="mr-1.5 text-brand-maroon focus:ring-brand-maroon"
                          />
                          {pos.label}
                        </label>
                      ))}
                    </div>

                    {selectedHackathonPos === 'Other' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          {...register("hackathon_other_position", {
                            validate: (v) => {
                              if (watch('type') === 'Hackathon' && watch('hackathon_position') === 'Other' && (!v || !v.trim())) {
                                return 'Please type your Hackathon position';
                              }
                              return true;
                            }
                          })}
                          placeholder="Type position / award (e.g., Runner Up, Consolation, Special Mention)"
                          className="w-full px-3 py-2 text-sm border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-400"
                        />
                        {errors.hackathon_other_position && (
                          <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_other_position.message}</span>
                        )}
                      </div>
                    )}

                    {errors.hackathon_position && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_position.message}</span>
                    )}

                    {/* Hackathon Certificate / Proof Attachment */}
                    <div className="mt-4 pt-3.5 border-t border-amber-200/90">
                      <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-700" />
                          Attach Proof / Certificate <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-red-700 bg-red-100/80 px-2 py-0.5 rounded border border-red-200">Required</span>
                      </label>
                      <p className="text-[11px] text-amber-900/70 mb-2.5">
                        Upload certificate of participation, achievement, or prize (PDF, PNG, JPG up to 10MB).
                      </p>

                      {!certificateFile ? (
                        <div>
                          <label
                            htmlFor="hackathon-certificate-upload"
                            className={`flex items-center justify-center gap-2 w-full cursor-pointer px-4 py-3 rounded-lg font-medium text-xs transition group shadow-2xs ${
                              certificateError
                                ? 'bg-red-50/70 hover:bg-red-100/70 border-2 border-dashed border-red-300 text-red-800'
                                : 'bg-white hover:bg-amber-100/60 border-2 border-dashed border-amber-300 hover:border-amber-400 text-amber-900'
                            }`}
                          >
                            <Paperclip className={`w-4 h-4 transition ${certificateError ? 'text-red-600' : 'text-amber-600 group-hover:scale-110'}`} />
                            <span>Click to attach certificate or proof document</span>
                          </label>
                          <input
                            id="hackathon-certificate-upload"
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleCertificateChange}
                          />
                        </div>
                      ) : (
                        <div className="bg-white border border-amber-300 rounded-lg p-2.5 flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {certificateFile.isPdf ? (
                              <div className="w-9 h-9 rounded-md bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold text-[10px] tracking-wider border border-red-200">
                                PDF
                              </div>
                            ) : (
                              <img
                                src={certificateFile.preview}
                                alt="Certificate Preview"
                                className="w-9 h-9 object-cover rounded-md border border-gray-200 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate" title={certificateFile.name}>
                                {certificateFile.name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {certificateFile.size} • {certificateFile.isPdf ? 'PDF Document' : 'Image Certificate'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeCertificate}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition shrink-0 ml-2"
                            title="Remove attached certificate"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {certificateError && (
                        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {certificateError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project Domain</label>
                  <select {...register("domain", { required: "Required" })} className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none bg-white text-gray-800">
                    <option value="">Select Domain...</option>
                    {PROJECT_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Semester</label>
                    <select {...register("semester", { required: "Required" })} className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none bg-white text-gray-800">
                      <option value="">Select Semester...</option>
                      {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year</label>
                    <select {...register("academic_year", { required: "Required" })} className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none bg-white text-gray-800">
                      <option value="">Select Year...</option>
                      {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Project Description</label>
              <textarea {...register("description", { required: "Description is required", minLength: { value: 100, message: "Description must be at least 100 characters long" } })} rows={3} className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800" placeholder="Provide a detailed overview of your project goals, methodology, and expected outcomes..." />
              <p className={`text-[11px] mt-1 ${watch('description')?.length < 100 ? 'text-amber-600 font-medium' : 'text-gray-500'} text-right`}>
                {watch('description')?.length || 0} characters (min 100)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">GitHub Repository Link (Optional)</label>
                <input type="url" {...register("github_link")} placeholder="https://github.com/your-username/repo" className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn Post/Demo Link (Optional)</label>
                <input type="url" {...register("linkedin_link")} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Technologies Used</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {technologies.map(t => (
                  <span key={t} className="px-2.5 py-0.5 bg-gray-100 text-gray-800 border border-gray-200 rounded text-xs font-medium flex items-center">
                    {t} <button type="button" onClick={()=>removeTech(t)} className="ml-1.5 text-gray-500 hover:text-red-600 font-bold">&times;</button>
                  </span>
                ))}
              </div>
              <input type="text" value={techInput} onChange={e=>setTechInput(e.target.value)} onKeyDown={handleAddTech} placeholder="Type technology and press Enter" className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800" />
              <input type="hidden" {...register("technologies", { validate: v => v.length > 0 || "Add at least one tech" })} />
            </div>
          </div>
        </div>

        {/* SECTION B - SDG GOALS */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">B. UN Sustainable Development Goals Addressed</h2>
            <span className="text-[11px] text-white/80 hidden sm:inline">Select all goals your project addresses</span>
          </div>
          <div className="p-4 sm:p-5">
            <Controller
              control={control}
              name="sdg_goals"
              render={({ field: { value, onChange } }) => (
                <>
                  <p className="mb-3 text-xs font-semibold text-gray-600">{value.length} goals selected</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {SDG_GOALS.map(goal => {
                      const isSelected = value.includes(goal.id);
                      return (
                        <div
                          key={goal.id}
                          onClick={() => onChange(isSelected ? value.filter(v => v !== goal.id) : [...value, goal.id])}
                          className={`cursor-pointer rounded-md p-2.5 h-20 flex flex-col justify-between transition border ${isSelected ? 'border-transparent shadow-xs text-white' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'}`}
                          style={{ backgroundColor: isSelected ? goal.color : 'white' }}
                        >
                          <div className="flex justify-between items-start">
                            <span className={`text-base font-bold ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>{goal.id}</span>
                            {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                          </div>
                          <span className={`text-[11px] font-semibold leading-tight line-clamp-2 ${isSelected?'text-white':'text-gray-700'}`}>{goal.title}</span>
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
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white tracking-wide">C. Programme Outcomes (POs) Addressed</h2>
          </div>
          <div className="p-4 sm:p-5">
            <Controller
              control={control}
              name="pos"
              render={({ field: { value, onChange } }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PO_LIST.map(po => {
                    const isSelected = value.includes(po.id);
                    return (
                      <div key={po.id} className={`flex items-start p-2.5 border rounded-md transition ${isSelected?'border-brand-maroon bg-red-50/40':'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          className="mt-0.5 mr-2.5 h-3.5 w-3.5 text-brand-maroon focus:ring-brand-maroon border-gray-300 rounded"
                          checked={isSelected}
                          onChange={(e) => onChange(e.target.checked ? [...value, po.id] : value.filter(v => v !== po.id))}
                        />
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{po.id}: {po.title}</p>
                          <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{po.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </div>

        {/* SECTION D - MENTOR */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white tracking-wide">D. PBL Coordinator Mapping</h2>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select PBL Coordinator</label>
                <select {...register("mentor_id", { required: "Required" })} className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none bg-white text-gray-800">
                  <option value="">Select PBL Coordinator...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}> {t.full_name} — {t.department}</option>)}
                </select>
                {errors.mentor_id && <span className="text-red-500 text-xs mt-1 block">{errors.mentor_id.message}</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Assign the department faculty coordinator responsible for evaluating and certifying this project.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION E - TEAM MEMBERS */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">E. Team Members</h2>
            <span className="text-[11px] text-white/80 hidden sm:inline">Add up to 5 members</span>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {fields.map((item, index) => (
              <div key={item.id} className="flex flex-col md:flex-row gap-3 items-end bg-gray-50/70 p-3 rounded-md border border-gray-200/80">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Student Name</label>
                  <input {...register(`team_members.${index}.name`, { required: true })} className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">Roll Number</label>
                  <input {...register(`team_members.${index}.rollNumber`, { required: true })} className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none" />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">RBT Number</label>
                  <input {...register(`team_members.${index}.rbtNumber`, { required: true })} className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none" />
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200/80 hover:bg-red-100 rounded-md text-xs font-medium w-full md:w-auto h-[32px] transition">
                    Remove
                  </button>
                )}
              </div>
            ))}
            {fields.length < 5 && (
              <button type="button" onClick={() => append({ name: '', rollNumber: '', rbtNumber: '' })} className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-700 font-medium text-xs rounded-md hover:border-gray-400 hover:bg-gray-50 transition">
                + Add Member
              </button>
            )}
          </div>
        </div>

        {/* SECTION F - PROJECT SCREENSHOTS */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4" /> F. Project Screenshots
            </h2>
            <span className="text-[11px] text-white/80 hidden sm:inline">Upload 2–6 screenshots</span>
          </div>
          <div className="p-4 sm:p-5">
            {/* Upload Button */}
            <label
              htmlFor="screenshot-upload"
              className="flex items-center gap-1.5 w-fit cursor-pointer px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-md text-gray-700 font-medium text-xs transition"
            >
              <Camera className="w-3.5 h-3.5" />
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
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {screenshots.map((entry, idx) => (
                  <div key={idx} className="relative group rounded-md overflow-hidden border border-gray-200 shadow-2xs">
                    <img
                      src={entry.preview}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeScreenshot(idx)}
                        className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition shadow"
                        title="Remove screenshot"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[11px] text-center py-0.5">
                      Screenshot {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {screenshotError && (
              <p className="mt-2 text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {screenshotError}
              </p>
            )}
            {screenshots.length < 2 && !screenshotError && (
              <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" /> At least 2 screenshots are required (JPEG, PNG, WebP up to 10MB).
              </p>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="text-center pt-2">
          <button type="submit" disabled={loading} className="w-full max-w-md mx-auto py-2.5 px-6 bg-brand-maroon hover:bg-[#783030] text-white font-semibold text-sm rounded-md shadow-xs transition disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Submitting...' : 'Submit Project for Approval'}
          </button>
        </div>
      </form>
    </div>
  </DashboardLayout>
  );
}
