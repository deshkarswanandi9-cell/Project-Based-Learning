import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getTeachers, registerProject, supabase } from '../../utils/api';
import { PROJECT_DOMAINS, PROJECT_TYPES, SDG_GOALS, PO_LIST, PSO_LIST, SEMESTERS, ACADEMIC_YEARS } from '../../utils/constants';
import { getSdgLogo } from '../../utils/sdgLogos';
import { Check, XCircle, AlertCircle, Camera, X as XIcon, Award, Paperclip, FileText, Eye } from 'lucide-react';
import AIRecommendationsSection from '../../components/student/AIRecommendationsSection';
import ProjectDocumentViewer from '../../components/common/ProjectDocumentViewer';

export const MAX_SCREENSHOTS = 4;
export const MAX_CERTIFICATES = 3;

export default function RegisterProject() {
  const { profile, user, role } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Read from session storage if available
  const savedDraft = JSON.parse(sessionStorage.getItem('registerProjectDraft'));

  let initialType = savedDraft?.type || '';
  let initialHackathonPos = savedDraft?.hackathon_position || '';
  let initialAwardType = savedDraft?.hackathon_award_type || '';

  if (initialType.startsWith('Hackathon')) {
    const match = initialType.match(/^Hackathon\s*\((.*)\)$/);
    if (match) {
      initialType = 'Hackathon';
      const extracted = match[1];
      if (['1st', '2nd', '3rd', 'Participant'].includes(extracted)) {
        initialHackathonPos = initialHackathonPos || extracted;
      } else if (extracted.includes('Consolation')) {
        initialHackathonPos = initialHackathonPos || 'Other';
        initialAwardType = initialAwardType || 'Consolation';
      } else if (extracted.includes('Special Mention')) {
        initialHackathonPos = initialHackathonPos || 'Other';
        initialAwardType = initialAwardType || 'Special Mention';
      } else {
        initialHackathonPos = initialHackathonPos || 'Other';
      }
    }
  } else if (initialType === 'Mini') {
    initialType = 'Mini Project';
  } else if (initialType === 'Industry') {
    initialType = 'Industry Sponsored';
  } else if (initialType === 'Complex Engineering') {
    initialType = 'Complex Engineering Problems';
  }

  const defaultFormValues = {
    title: '', domain: '', description: '', github_link: '', linkedin_link: '',
    faculty_mentor_name: savedDraft?.faculty_mentor_name || '',
    semester: '', academic_year: '', mentor_id: '',
    team_members: [{ name: '', rollNumber: '', rbtNumber: '' }],
    sdg_goals: [],
    pos: [],
    psos: [],
    technologies: [],
    ...(savedDraft || {}),
    type: initialType || savedDraft?.type || '',
    hackathon_title: savedDraft?.hackathon_title || '',
    hackathon_position: initialHackathonPos || savedDraft?.hackathon_position || '',
    hackathon_award_type: initialAwardType || savedDraft?.hackathon_award_type || '',
    achievement_title: savedDraft?.achievement_title || '',
    achievement_description: savedDraft?.achievement_description || '',
    city: savedDraft?.city || '',
    state: savedDraft?.state || '',
    pincode: savedDraft?.pincode || '',
    venue_details: savedDraft?.venue_details || ''
  };

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: defaultFormValues
  });

  const formValues = watch();
  const selectedType = watch('type');
  const selectedHackathonPos = watch('hackathon_position');
  const selectedAwardType = watch('hackathon_award_type');
  const watchedAchievementDesc = watch('achievement_description') || '';

  // Helper function to count words accurately
  const countWords = (text) => {
    if (!text) return 0;
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  };

  const achievementWordCount = countWords(watchedAchievementDesc);

  // Save draft whenever form values change
  useEffect(() => {
    sessionStorage.setItem('registerProjectDraft', JSON.stringify(formValues));
  }, [formValues]);

  // Clean stale fields when position changes away from 'Other'
  useEffect(() => {
    if (selectedHackathonPos !== 'Other') {
      setValue('hackathon_award_type', '');
      setValue('achievement_title', '');
      setValue('achievement_description', '');
    }
  }, [selectedHackathonPos, setValue]);

  // Clean stale achievement fields when award type is not 'Special Mention'
  useEffect(() => {
    if (selectedAwardType !== 'Special Mention') {
      setValue('achievement_title', '');
      setValue('achievement_description', '');
    }
  }, [selectedAwardType, setValue]);

  const { fields, append, remove } = useFieldArray({ control, name: 'team_members' });
  const [techInput, setTechInput] = useState('');
  const technologies = watch('technologies');
  const watchedTitle = watch('title') || '';
  const watchedDescription = watch('description') || '';
  const watchedDomain = watch('domain') || '';
  const watchedSDGs = watch('sdg_goals') || [];
  const watchedPOs = watch('pos') || [];
  const watchedPSOs = watch('psos') || [];

  const handleAcceptSDG = (sdgNum) => {
    const current = watch('sdg_goals') || [];
    if (!current.includes(sdgNum)) {
      setValue('sdg_goals', [...current, sdgNum], { shouldValidate: true, shouldDirty: true });
      toast.success(`SDG ${sdgNum} added to project selections.`);
    }
  };

  const handleAcceptPO = (poId) => {
    const current = watch('pos') || [];
    if (!current.includes(poId)) {
      setValue('pos', [...current, poId], { shouldValidate: true, shouldDirty: true });
      toast.success(`${poId} added to project selections.`);
    }
  };

  const handleAcceptPSO = (psoId) => {
    const current = watch('psos') || [];
    if (!current.includes(psoId)) {
      setValue('psos', [...current, psoId], { shouldValidate: true, shouldDirty: true });
      toast.success(`${psoId} added to project selections.`);
    }
  };

  const handleAcceptAllSDGs = (sdgNumbers) => {
    const current = watch('sdg_goals') || [];
    const merged = Array.from(new Set([...current, ...sdgNumbers]));
    setValue('sdg_goals', merged, { shouldValidate: true, shouldDirty: true });
    toast.success('Recommended SDGs added to project.');
  };

  const handleAcceptAllPOs = (poIds) => {
    const current = watch('pos') || [];
    const merged = Array.from(new Set([...current, ...poIds]));
    setValue('pos', merged, { shouldValidate: true, shouldDirty: true });
    toast.success('Recommended POs added to project.');
  };

  const handleAcceptAllPSOs = (psoIds) => {
    const current = watch('psos') || [];
    const merged = Array.from(new Set([...current, ...psoIds]));
    setValue('psos', merged, { shouldValidate: true, shouldDirty: true });
    toast.success('Recommended PSOs added to project.');
  };

  // Screenshot state (maximum 4 attachments)
  const [screenshots, setScreenshots] = useState([]);  // Array of { file, preview }
  const [screenshotError, setScreenshotError] = useState('');

  // Hackathon certificate / proof state (maximum 3 attachments)
  const [certificates, setCertificates] = useState([]); // Array of { file, preview, name, size, isPdf }
  const [certificateError, setCertificateError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getTeachers()
      .then(data => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setTeachers(data);
        } else {
          setTeachers([
            { id: 16, user_id: '64b7d326-2b3d-47b7-891e-f602aa3a5d7c', full_name: 'Dr. S. K. Patil (shiva)', department: 'Computer Engineering' },
            { id: 18, user_id: 'ca28f78d-66dc-4ed2-8ee6-5233f00fd4e9', full_name: 'prof. Vaishnavi Chitragar', department: 'Computer Engineering' }
          ]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setTeachers([
          { id: 16, user_id: '64b7d326-2b3d-47b7-891e-f602aa3a5d7c', full_name: 'Dr. S. K. Patil (shiva)', department: 'Computer Engineering' },
          { id: 18, user_id: 'ca28f78d-66dc-4ed2-8ee6-5233f00fd4e9', full_name: 'prof. Vaishnavi Chitragar', department: 'Computer Engineering' }
        ]);
      });
    return () => { isMounted = false; };
  }, [user]);

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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length + screenshots.length > MAX_SCREENSHOTS) {
      setScreenshotError(`You can upload a maximum of ${MAX_SCREENSHOTS} screenshots.`);
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
    setScreenshotError('');
  };

  const handleCertificateChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length + certificates.length > MAX_CERTIFICATES) {
      setCertificateError(`You can upload a maximum of ${MAX_CERTIFICATES} certificate documents.`);
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const invalidType = selectedFiles.find(f => !allowedTypes.includes(f.type));
    if (invalidType) {
      setCertificateError('Please upload a PDF or an image (PNG, JPG, WebP).');
      return;
    }

    const oversized = selectedFiles.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setCertificateError(`File "${oversized.name}" exceeds the 10MB limit.`);
      return;
    }

    setCertificateError('');
    const newCerts = selectedFiles.map(file => {
      const isPdf = file.type === 'application/pdf';
      return {
        file,
        preview: isPdf ? null : URL.createObjectURL(file),
        name: file.name,
        size: file.size < 1024 * 1024 
          ? `${(file.size / 1024).toFixed(1)} KB` 
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        isPdf
      };
    });

    setCertificates(prev => [...prev, ...newCerts]);
    e.target.value = '';
  };

  const removeCertificate = (indexToRemove) => {
    setCertificates(prev => {
      const toRemove = prev[indexToRemove];
      if (toRemove?.preview) {
        URL.revokeObjectURL(toRemove.preview);
      }
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (watch('type') === 'Hackathon' && updated.length === 0) {
        setCertificateError('Please attach a proof / certificate for the Hackathon.');
      } else {
        setCertificateError('');
      }
      return updated;
    });
  };

  useEffect(() => {
    if (selectedType !== 'Hackathon') {
      if (certificateError) setCertificateError('');
      setValue('hackathon_title', '');
      setValue('hackathon_position', '');
      setValue('hackathon_award_type', '');
      setValue('achievement_title', '');
      setValue('achievement_description', '');
      setValue('location_mode', 'In-Person / Physical Venue');
      setValue('city', '');
      setValue('state', '');
      setValue('pincode', '');
      setValue('venue_details', '');
      setCertificates(prev => {
        prev.forEach(c => {
          if (c.preview) URL.revokeObjectURL(c.preview);
        });
        return [];
      });
    }
  }, [selectedType, certificateError, setValue]);

  const onSubmit = async (data) => {
    // Validate Hackathon fields
    if (data.type === 'Hackathon') {
      if (certificates.length === 0) {
        setCertificateError('Please attach a proof / certificate for the Hackathon.');
        return;
      }
      if (certificates.length > MAX_CERTIFICATES) {
        setCertificateError(`You can upload a maximum of ${MAX_CERTIFICATES} certificate documents.`);
        return;
      }
      if (!data.hackathon_title || !data.hackathon_title.trim()) {
        toast.error('Hackathon title is required.');
        return;
      }
      if (!data.hackathon_position) {
        toast.error('Please select your position secured in the Hackathon.');
        return;
      }
      if (data.hackathon_position === 'Other' && !data.hackathon_award_type) {
        toast.error('Please select an Award / Recognition Type (Consolation or Special Mention).');
        return;
      }
      if (data.hackathon_position === 'Other' && data.hackathon_award_type === 'Special Mention') {
        if (!data.achievement_title || !data.achievement_title.trim()) {
          toast.error('Achievement title is required for Special Mention.');
          return;
        }
        if (!data.achievement_description || !data.achievement_description.trim()) {
          toast.error('Achievement description is required for Special Mention.');
          return;
        }
        const descWords = countWords(data.achievement_description);
        if (descWords > 100) {
          toast.error(`Achievement description exceeds 100 words (${descWords} words). Please shorten it.`);
          return;
        }
      }
      if (data.location_mode === 'In-Person / Physical Venue') {
        if (!data.city || !data.city.trim()) {
          toast.error('City is required for in-person hackathons.');
          return;
        }
        if (!data.state || !data.state.trim()) {
          toast.error('State is required for in-person hackathons.');
          return;
        }
        if (!data.pincode || !data.pincode.trim()) {
          toast.error('PIN code is required for in-person hackathons.');
          return;
        }
        if (!/^[1-9][0-9]{5}$/.test(data.pincode.trim())) {
          toast.error('Invalid PIN code. Indian postal codes must be exactly 6 digits (e.g. 411033).');
          return;
        }
        if (!data.venue_details || !data.venue_details.trim()) {
          toast.error('Manual venue / location details are required for in-person hackathons.');
          return;
        }
      } else if (data.location_mode === 'Online / Virtual') {
        if (!data.venue_details || !data.venue_details.trim()) {
          toast.error('Online platform or event location details are required.');
          return;
        }
      }
    }
    setCertificateError('');

    // Validate screenshots
    if (screenshots.length < 2) {
      setScreenshotError('Please upload at least two project screenshots.');
      return;
    }
    if (screenshots.length > MAX_SCREENSHOTS) {
      setScreenshotError(`You can upload a maximum of ${MAX_SCREENSHOTS} screenshots.`);
      return;
    }
    setScreenshotError('');

    // Guard against faculty submission (which violates foreign key and RLS constraints on projects table)
    if (role === 'teacher' || role === 'unapproved_teacher') {
      toast.error(
        `Cannot submit: You are currently logged in as faculty (${profile?.full_name || user?.email || 'Teacher'}). Projects must be registered and submitted from a student account.`,
        { duration: 8000 }
      );
      return;
    }

    const studentUserId = user?.id || profile?.user_id;
    if (!studentUserId) {
      toast.error('Session expired or student profile not loaded. Please log in again to submit.');
      return;
    }

    const studentIdPrefix = profile?.id || user?.id || 'student';

    setLoading(true);
    try {
      // Upload project screenshot images to Supabase storage (maximum 4)
      toast.loading('Uploading screenshots...', { id: 'upload' });
      const uploadedUrls = [];
      const validScreenshots = screenshots.slice(0, MAX_SCREENSHOTS);
      for (const entry of validScreenshots) {
        const fileExt = entry.file.name.split('.').pop();
        const fileName = `${studentIdPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('projects')
          .upload(fileName, entry.file, { contentType: entry.file.type });
        if (uploadError) throw uploadError;
        // Store the bucket-relative object path for secure private viewing
        uploadedUrls.push(uploadData.path || fileName);
      }

      // Upload Hackathon Certificates if attached (maximum 3)
      let uploadedCertificateUrl = null;
      if (data.type === 'Hackathon' && certificates.length > 0) {
        toast.loading('Uploading certificate proof...', { id: 'upload' });
        const validCerts = certificates.slice(0, MAX_CERTIFICATES);
        const uploadedCertUrls = [];
        for (const cert of validCerts) {
          const certExt = cert.file.name.split('.').pop();
          const certFileName = `cert-${studentIdPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${certExt}`;
          const { data: certUploadData, error: certUploadError } = await supabase.storage
            .from('projects')
            .upload(certFileName, cert.file, { contentType: cert.file.type });
          if (certUploadError) throw certUploadError;
          uploadedCertUrls.push(certUploadData.path || certFileName);
        }
        // Store single path or JSON array of paths
        uploadedCertificateUrl = uploadedCertUrls.length === 1
          ? uploadedCertUrls[0]
          : JSON.stringify(uploadedCertUrls);
      }

      toast.loading('Submitting project...', { id: 'upload' });
      const mentor = teachers.find(t => String(t.id) === String(data.mentor_id) || t.user_id === data.mentor_id) || teachers[0] || null;

      // Sanitize hackathon payload: Ensure hidden conditional values never leak
      let finalType = data.type;
      const hackathonData = {};

      if (data.type === 'Hackathon') {
        const pos = data.hackathon_position;
        const award = pos === 'Other' ? data.hackathon_award_type : null;
        const isSpecialMention = pos === 'Other' && award === 'Special Mention';
        const isOnline = data.location_mode === 'Online / Virtual';

        const posText = pos === 'Other'
          ? (award ? `${pos} - ${award}` : 'Other')
          : pos;
        finalType = posText ? `Hackathon (${posText})` : 'Hackathon';

        if (data.hackathon_title?.trim()) hackathonData.hackathon_title = data.hackathon_title.trim();
        if (pos) hackathonData.hackathon_position = pos;
        if (award) hackathonData.hackathon_award_type = award;
        if (isSpecialMention && data.achievement_title?.trim()) hackathonData.achievement_title = data.achievement_title.trim();
        if (isSpecialMention && data.achievement_description?.trim()) hackathonData.achievement_description = data.achievement_description.trim();
        if (data.location_mode) hackathonData.location_mode = data.location_mode;
        if (!isOnline && data.city?.trim()) hackathonData.city = data.city.trim();
        if (!isOnline && data.state?.trim()) hackathonData.state = data.state.trim();
        if (!isOnline && data.pincode?.trim()) hackathonData.pincode = data.pincode.trim();
        if (data.venue_details?.trim()) hackathonData.venue_details = data.venue_details.trim();
      }

      // Validate PSOs strictly against official RSCOE definitions
      const validPsos = (data.psos || []).filter(p => ['PSO1', 'PSO2', 'PSO3'].includes(p));

      const projectPayload = {
        title: data.title?.trim(),
        type: finalType,
        domain: data.domain,
        description: data.description,
        technologies: data.technologies,
        sdg_goals: (data.sdg_goals || []).map(Number),
        pos: data.pos,
        mentor_id: mentor?.user_id || null,
        mentor_name: mentor?.full_name || 'Department Faculty',
        student_id: studentUserId,
        semester: data.semester,
        academic_year: data.academic_year,
        screenshot_urls: uploadedUrls,
        document_url: uploadedCertificateUrl,
        team_members: data.team_members,
        status: 'Pending',
        ...hackathonData
      };

      if (data.faculty_mentor_name?.trim()) {
        projectPayload.faculty_mentor_name = data.faculty_mentor_name.trim();
      }
      if (validPsos && validPsos.length > 0) {
        projectPayload.psos = validPsos;
      }
      if (data.github_link?.trim()) {
        projectPayload.github_link = data.github_link.trim();
      }
      if (data.linkedin_link?.trim()) {
        projectPayload.linkedin_link = data.linkedin_link.trim();
      }

      let missingColumnsEncountered = [];
      const potentialNewCols = [
        'faculty_mentor_name',
        'psos',
        'hackathon_title',
        'hackathon_position',
        'hackathon_award_type',
        'achievement_title',
        'achievement_description',
        'location_mode',
        'city',
        'state',
        'pincode',
        'venue_details'
      ];

      let currentPayload = { ...projectPayload };
      let registered = false;

      for (let attempt = 0; attempt < 6 && !registered; attempt++) {
        try {
          await registerProject(currentPayload);
          registered = true;
        } catch (dbErr) {
          const errMsg = (dbErr?.message || '').toLowerCase();
          const isSchemaOrColErr = errMsg.includes('column') ||
            errMsg.includes('does not exist') ||
            errMsg.includes('schema cache') ||
            errMsg.includes('pgrst204') ||
            errMsg.includes('42703');

          if (!isSchemaOrColErr) {
            throw dbErr;
          }

          console.warn(`[RegisterProject] Attempt ${attempt + 1}: Database projects table lacks pending migration columns. Retrying without unmigrated fields.`, dbErr.message);

          // If error mentions specific columns on attempt 0, target them; otherwise strip all new migration columns immediately
          const matchedCols = potentialNewCols.filter(col => errMsg.includes(col));
          const colsToRemove = matchedCols.length > 0 && attempt === 0
            ? matchedCols
            : potentialNewCols;

          let removedAny = false;
          colsToRemove.forEach(col => {
            if (col in currentPayload) {
              const val = currentPayload[col];
              if (val !== undefined && val !== null) {
                if (Array.isArray(val) && val.length > 0) {
                  if (!missingColumnsEncountered.includes(col)) missingColumnsEncountered.push(col);
                } else if (typeof val === 'string' && val.trim()) {
                  if (!missingColumnsEncountered.includes(col)) missingColumnsEncountered.push(col);
                } else if (typeof val !== 'string') {
                  if (!missingColumnsEncountered.includes(col)) missingColumnsEncountered.push(col);
                }
              }
              delete currentPayload[col];
              removedAny = true;
            }
          });

          if (!removedAny) {
            // Strip any remaining unmigrated columns as safety fallback
            potentialNewCols.forEach(col => {
              if (col in currentPayload) {
                delete currentPayload[col];
                removedAny = true;
              }
            });
            if (!removedAny) {
              throw dbErr;
            }
          }
        }
      }

      if (missingColumnsEncountered.length > 0) {
        const labels = missingColumnsEncountered.map(c => {
          if (c === 'faculty_mentor_name') return 'Faculty Mentor Name';
          if (c === 'psos') return 'Department PSOs';
          if (c.startsWith('hackathon_') || c.startsWith('achievement_') || ['city','state','pincode','venue_details','location_mode'].includes(c)) return 'Hackathon / Achievement details';
          return c;
        });
        const uniqueLabels = Array.from(new Set(labels)).join(' and ');
        toast(
          `Project registered! Notice: ${uniqueLabels} could not be persisted because the database migration is pending administrator execution.`,
          {
            icon: '⚠️',
            duration: 8000,
            id: 'upload'
          }
        );
      } else {
        toast.success('Project submitted for approval!', { id: 'upload' });
      }
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
        {/* Faculty Mode Notice */}
        {(role === 'teacher' || role === 'unapproved_teacher') && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md shadow-2xs mb-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold text-amber-950 text-sm">Faculty Account Active ({profile?.full_name || user?.email})</p>
              <p className="mt-1">
                You are currently logged in with a faculty / coordinator account. In the RSCOE PBL Portal, project proposals are submitted by <strong>students</strong> so that coordinators can review, monitor, and approve them.
              </p>
              <p className="mt-1 font-semibold text-amber-950">
                To test submitting a project proposal for approval, please sign in with a student account.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
          {/* Global Error Summary */}
          {(Object.keys(errors).length > 0 || screenshotError || (selectedType === 'Hackathon' && certificateError)) && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-md flex flex-col gap-1 shadow-2xs animate-in fade-in slide-in-from-top-2">
              <p className="font-semibold text-xs flex items-center"><XCircle className="w-4 h-4 mr-1.5 shrink-0" /> Please fix the following errors before submitting:</p>
              <ul className="list-disc list-inside text-xs pl-2 space-y-0.5">
                {errors.title && <li>Project Title is required</li>}
                {errors.faculty_mentor_name && <li>{errors.faculty_mentor_name.message}</li>}
                {errors.description && <li>Description must be at least 100 characters</li>}
                {errors.technologies && <li>Please add at least one technology</li>}
                {errors.mentor_id && <li>Please select a PBL Coordinator</li>}
                {screenshotError && <li>{screenshotError}</li>}
                {selectedType === 'Hackathon' && certificateError && <li>{certificateError}</li>}
                {errors.type && <li>Project type is required</li>}
                {errors.hackathon_title && <li>{errors.hackathon_title.message}</li>}
                {errors.hackathon_position && <li>{errors.hackathon_position.message}</li>}
                {errors.hackathon_award_type && <li>{errors.hackathon_award_type.message}</li>}
                {errors.achievement_title && <li>{errors.achievement_title.message}</li>}
                {errors.achievement_description && <li>{errors.achievement_description.message}</li>}
                {errors.city && <li>{errors.city.message}</li>}
                {errors.state && <li>{errors.state.message}</li>}
                {errors.pincode && <li>{errors.pincode.message}</li>}
                {errors.venue_details && <li>{errors.venue_details.message}</li>}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                {...register("title", {
                  required: "Project Title is required",
                  validate: v => !!v?.trim() || "Project Title cannot be blank"
                })}
                placeholder="e.g. AI-Powered Smart Agriculture System"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800"
              />
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

                {/* Dedicated Hackathon Details Section */}
                {selectedType === 'Hackathon' && (
                  <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                      <Award className="w-4 h-4 text-brand-maroon" />
                      <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                        Hackathon Details
                      </h3>
                    </div>
                    
                    {/* A. Hackathon Title */}
                    <div>
                      <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider mb-1">
                        Hackathon Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("hackathon_title", {
                          validate: (v) => {
                            if (watch('type') === 'Hackathon' && (!v || !v.trim())) {
                              return 'Hackathon title is required';
                            }
                            return true;
                          }
                        })}
                        placeholder="Enter the official name of the hackathon"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                      />
                      {errors.hackathon_title && (
                        <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_title.message}</span>
                      )}
                    </div>

                    {/* Position Secured Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider mb-2">
                        Position Secured <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {[
                          { label: '1st', value: '1st' },
                          { label: '2nd', value: '2nd' },
                          { label: '3rd', value: '3rd' },
                          { label: 'Participant', value: 'Participant' },
                          { label: 'Other', value: 'Other' }
                        ].map(pos => (
                          <label key={pos.value} className="flex items-center text-xs sm:text-sm font-medium text-gray-800 cursor-pointer">
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
                      {errors.hackathon_position && (
                        <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_position.message}</span>
                      )}
                    </div>

                    {/* Conditional: Award / Recognition Type (When 'Other' is chosen) */}
                    {selectedHackathonPos === 'Other' && (
                      <div className="p-3 bg-white border border-amber-300 rounded-md animate-in fade-in duration-150">
                        <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2">
                          Award / Recognition Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap items-center gap-4">
                          {[
                            { label: 'Consolation', value: 'Consolation' },
                            { label: 'Special Mention', value: 'Special Mention' }
                          ].map(award => (
                            <label key={award.value} className="flex items-center text-xs sm:text-sm font-medium text-gray-800 cursor-pointer">
                              <input
                                type="radio"
                                value={award.value}
                                {...register("hackathon_award_type", {
                                  validate: (v) => {
                                    if (watch('type') === 'Hackathon' && watch('hackathon_position') === 'Other' && !v) {
                                      return 'Please select an Award / Recognition Type';
                                    }
                                    return true;
                                  }
                                })}
                                className="mr-1.5 text-brand-maroon focus:ring-brand-maroon"
                              />
                              {award.label}
                            </label>
                          ))}
                        </div>
                        {errors.hackathon_award_type && (
                          <span className="text-red-500 text-xs mt-1 block">{errors.hackathon_award_type.message}</span>
                        )}
                      </div>
                    )}

                    {/* Conditional: Highlight Your Achievement (When 'Special Mention' is chosen) */}
                    {selectedHackathonPos === 'Other' && selectedAwardType === 'Special Mention' && (
                      <div className="p-3.5 bg-amber-100/60 border border-amber-300 rounded-md space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-brand-maroon" />
                          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                            Highlight Your Achievement
                          </h4>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-800 mb-1">
                            Achievement Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...register("achievement_title", {
                              validate: (v) => {
                                if (
                                  watch('type') === 'Hackathon' &&
                                  watch('hackathon_position') === 'Other' &&
                                  watch('hackathon_award_type') === 'Special Mention' &&
                                  (!v || !v.trim())
                                ) {
                                  return 'Achievement title is required for Special Mention';
                                }
                                return true;
                              }
                            })}
                            placeholder="e.g., Best UI/UX Design, Social Impact Innovation Award"
                            className="w-full px-3 py-1.5 text-xs sm:text-sm border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                          />
                          {errors.achievement_title && (
                            <span className="text-red-500 text-xs mt-1 block">{errors.achievement_title.message}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-medium text-gray-800">
                              Achievement Description (Maximum 100 words) <span className="text-red-500">*</span>
                            </label>
                            <span
                              className={`text-[11px] font-semibold ${
                                achievementWordCount > 100
                                  ? 'text-red-600 bg-red-100 px-1.5 py-0.5 rounded'
                                  : 'text-gray-600'
                              }`}
                            >
                              {achievementWordCount} / 100 words
                            </span>
                          </div>
                          <textarea
                            rows={3}
                            {...register("achievement_description", {
                              validate: (v) => {
                                if (
                                  watch('type') === 'Hackathon' &&
                                  watch('hackathon_position') === 'Other' &&
                                  watch('hackathon_award_type') === 'Special Mention'
                                ) {
                                  if (!v || !v.trim()) {
                                    return 'Achievement description is required for Special Mention';
                                  }
                                  const count = countWords(v);
                                  if (count > 100) {
                                    return `Achievement description must not exceed 100 words (${count} words entered)`;
                                  }
                                }
                                return true;
                              }
                            })}
                            placeholder="Briefly describe the jury recognition, standout innovation, or criteria that earned this special mention..."
                            className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md bg-white focus:outline-none text-gray-800 placeholder-gray-400 ${
                              achievementWordCount > 100
                                ? 'border-red-400 focus:ring-2 focus:ring-red-400'
                                : 'border-amber-300 focus:ring-2 focus:ring-amber-500'
                            }`}
                          />
                          {errors.achievement_description && (
                            <span className="text-red-500 text-xs mt-1 block">{errors.achievement_description.message}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* B. Hackathon Location */}
                    <div className="pt-2 border-t border-amber-200">
                      <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider mb-2">
                        B. Hackathon Location <span className="text-red-500">*</span>
                      </label>
                      
                      <div className="mb-3">
                        <label className="block text-[11px] font-medium text-gray-700 mb-1">Location Mode</label>
                        <select
                          {...register("location_mode")}
                          className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800"
                        >
                          <option value="In-Person / Physical Venue">In-Person / Physical Venue</option>
                          <option value="Online / Virtual">Online / Virtual</option>
                        </select>
                      </div>

                      {/* In-Person Location Fields */}
                      {watch('location_mode') !== 'Online / Virtual' ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2.5">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                {...register("city", {
                                  validate: (v) => {
                                    if (watch('type') === 'Hackathon' && watch('location_mode') !== 'Online / Virtual' && (!v || !v.trim())) {
                                      return 'City is required for in-person hackathons';
                                    }
                                    return true;
                                  }
                                })}
                                placeholder="e.g., Pune"
                                className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                              />
                              {errors.city && (
                                <span className="text-red-500 text-[10px] mt-0.5 block">{errors.city.message}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                State <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                {...register("state", {
                                  validate: (v) => {
                                    if (watch('type') === 'Hackathon' && watch('location_mode') !== 'Online / Virtual' && (!v || !v.trim())) {
                                      return 'State is required for in-person hackathons';
                                    }
                                    return true;
                                  }
                                })}
                                placeholder="e.g., Maharashtra"
                                className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                              />
                              {errors.state && (
                                <span className="text-red-500 text-[10px] mt-0.5 block">{errors.state.message}</span>
                              )}
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                PIN Code <span className="text-red-500">*</span> <span className="text-[10px] text-gray-500">(Indian 6-digit)</span>
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                {...register("pincode", {
                                  validate: (v) => {
                                    if (watch('type') === 'Hackathon' && watch('location_mode') !== 'Online / Virtual') {
                                      if (!v || !v.trim()) return 'PIN code is required';
                                      if (!/^[1-9][0-9]{5}$/.test(v.trim())) {
                                        return 'Must be a valid 6-digit Indian PIN code (e.g. 411033)';
                                      }
                                    }
                                    return true;
                                  }
                                })}
                                placeholder="e.g., 411033"
                                className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                              />
                              {errors.pincode && (
                                <span className="text-red-500 text-[10px] mt-0.5 block">{errors.pincode.message}</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                              Manual Venue / Location Details <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={2}
                              {...register("venue_details", {
                                validate: (v) => {
                                  if (watch('type') === 'Hackathon' && watch('location_mode') !== 'Online / Virtual' && (!v || !v.trim())) {
                                    return 'Manual venue / location details are required';
                                  }
                                  return true;
                                }
                              })}
                              placeholder="e.g., Innovation Lab, Example College, Tathawade (building, hall, address details)"
                              className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                            />
                            {errors.venue_details && (
                              <span className="text-red-500 text-[10px] mt-0.5 block">{errors.venue_details.message}</span>
                            )}
                          </div>
                        </>
                      ) : (
                        /* Online / Virtual Location Field */
                        <div>
                          <label className="block text-[11px] font-medium text-gray-700 mb-1">
                            Online Platform / Event Location Details <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...register("venue_details", {
                              validate: (v) => {
                                if (watch('type') === 'Hackathon' && watch('location_mode') === 'Online / Virtual' && (!v || !v.trim())) {
                                  return 'Online platform name or event URL is required';
                                }
                                return true;
                              }
                            })}
                            placeholder="e.g., Unstop Platform, Devfolio, Discord Server, or event URL"
                            className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800 placeholder-gray-400"
                          />
                          {errors.venue_details && (
                            <span className="text-red-500 text-[10px] mt-0.5 block">{errors.venue_details.message}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 6. Hackathon Certificate / Proof Attachment (Max 3) */}
                    <div className="pt-3 border-t border-amber-200">
                      <label className="block text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-700" />
                          Attach Proof / Certificate (Max 3) <span className="text-red-500">*</span>
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${
                          certificates.length === 0
                            ? 'text-red-700 bg-red-100/80 border-red-200'
                            : 'text-emerald-700 bg-emerald-100/80 border-emerald-200'
                        }`}>
                          {certificates.length === 0 ? 'Required' : `${certificates.length} of 3 Attached`}
                        </span>
                      </label>
                      <p className="text-[11px] text-amber-900/70 mb-2.5">
                        Upload up to 3 certificates of participation, achievement, or prize documents (PDF, PNG, JPG up to 10MB each).
                      </p>

                      {/* Add button or limit reached message */}
                      {certificates.length < MAX_CERTIFICATES ? (
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
                            <span>
                              {certificates.length === 0
                                ? 'Click to attach certificate or proof document (Max 3)'
                                : `Attach Another Certificate or Proof Document (${certificates.length}/${MAX_CERTIFICATES})`}
                            </span>
                          </label>
                          <input
                            id="hackathon-certificate-upload"
                            type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleCertificateChange}
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-lg text-xs font-medium text-amber-900 flex items-center gap-2 shadow-2xs">
                          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Maximum limit of 3 certificate documents reached. Remove an attachment to add another.</span>
                        </div>
                      )}

                      {/* Uploaded Certificate Items */}
                      {certificates.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {certificates.map((cert, index) => (
                            <div key={index} className="bg-white border border-amber-300 rounded-lg p-2.5 flex items-center justify-between shadow-2xs">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                {cert.isPdf ? (
                                  <div className="w-9 h-9 rounded-md bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold text-[10px] tracking-wider border border-red-200">
                                    PDF
                                  </div>
                                ) : (
                                  <img
                                    src={cert.preview}
                                    alt={`Certificate ${index + 1}`}
                                    className="w-9 h-9 object-cover rounded-md border border-gray-200 shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                      File {index + 1}
                                    </span>
                                    <p className="text-xs font-semibold text-gray-800 truncate" title={cert.name}>
                                      {cert.name}
                                    </p>
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">
                                    {cert.size} • {cert.isPdf ? 'PDF Document' : 'Image Certificate'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCertificate(index)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition shrink-0 ml-2 cursor-pointer"
                                title={`Remove certificate ${index + 1}`}
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
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

        {/* AI-POWERED SDG, PO & PSO RECOMMENDATIONS */}
        <AIRecommendationsSection
          projectData={{
            title: watchedTitle,
            description: watchedDescription,
            type: selectedType,
            domain: watchedDomain,
            technologies: technologies || []
          }}
          selectedSDGs={watchedSDGs}
          selectedPOs={watchedPOs}
          selectedPSOs={watchedPSOs}
          onAcceptSDG={handleAcceptSDG}
          onAcceptPO={handleAcceptPO}
          onAcceptPSO={handleAcceptPSO}
          onAcceptAllSDGs={handleAcceptAllSDGs}
          onAcceptAllPOs={handleAcceptAllPOs}
          onAcceptAllPSOs={handleAcceptAllPSOs}
        />

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
                  <p className="mb-3.5 text-xs font-semibold text-gray-600 flex items-center justify-between">
                    <span>{value.length} of {SDG_GOALS.length} goals selected</span>
                    <span className="text-[11px] text-gray-400 font-normal">Click a card to toggle selection</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
                    {SDG_GOALS.map(goal => {
                      const isSelected = value.includes(goal.id);
                      const logoUrl = getSdgLogo(goal.id);
                      return (
                        <div
                          key={goal.id}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => onChange(isSelected ? value.filter(v => v !== goal.id) : [...value, goal.id])}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              onChange(isSelected ? value.filter(v => v !== goal.id) : [...value, goal.id]);
                            }
                          }}
                          className={`cursor-pointer rounded-lg p-3 sm:p-3.5 min-h-[126px] sm:min-h-[132px] lg:min-h-[138px] flex flex-col justify-between transition border select-none focus:outline-none focus:ring-2 focus:ring-brand-maroon ${
                            isSelected
                              ? 'border-transparent shadow-xs text-white ring-1 ring-black/10'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white text-gray-800'
                          }`}
                          style={{ backgroundColor: isSelected ? goal.color : 'white' }}
                        >
                          {/* Top Row: Larger Logo on left, SDG Number beside logo, Check indicator on right */}
                          <div className="flex items-start justify-between gap-1.5 mb-2.5">
                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                              {logoUrl && (
                                <img
                                  src={logoUrl}
                                  alt={`Official UN SDG ${goal.id} Logo - ${goal.title}`}
                                  className={`w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] md:w-[48px] md:h-[48px] lg:w-[52px] lg:h-[52px] rounded object-contain shrink-0 border ${
                                    isSelected
                                      ? 'border-white/40 bg-white/15'
                                      : 'border-gray-200 bg-white shadow-2xs'
                                  }`}
                                />
                              )}
                              <div className="flex flex-col justify-center">
                                <span className={`text-[10px] font-bold tracking-wider uppercase leading-none ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                  SDG
                                </span>
                                <span className={`text-base sm:text-lg font-extrabold leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                  {goal.id}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                                <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                              </div>
                            )}
                          </div>

                          {/* SDG Title below logo and number */}
                          <div className="mt-auto pt-1">
                            <span
                              className={`text-xs font-semibold leading-snug line-clamp-2 block ${
                                isSelected ? 'text-white' : 'text-gray-800'
                              }`}
                              title={`SDG ${goal.id}: ${goal.title}`}
                            >
                              {goal.title}
                            </span>
                          </div>
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

        {/* SECTION D - PROGRAMME SPECIFIC OUTCOMES */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">D. Programme Specific Outcomes (PSOs) Addressed</h2>
            <span className="text-[11px] text-white/80 hidden sm:inline">RSCOE Computer Engineering Department PSOs</span>
          </div>
          <div className="p-4 sm:p-5">
            <Controller
              control={control}
              name="psos"
              render={({ field: { value, onChange } }) => (
                <div>
                  <p className="mb-3 text-xs font-semibold text-gray-600">
                    {(value || []).length} / {PSO_LIST.length} department PSOs selected
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PSO_LIST.map(pso => {
                      const isSelected = (value || []).includes(pso.id);
                      return (
                        <div
                          key={pso.id}
                          onClick={() => {
                            const next = isSelected
                              ? (value || []).filter(v => v !== pso.id)
                              : [...(value || []), pso.id];
                            onChange(next);
                          }}
                          className={`cursor-pointer flex flex-col justify-between p-3.5 border rounded-md transition ${
                            isSelected
                              ? 'border-brand-maroon bg-red-50/40 shadow-xs'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // State driven by parent card onClick
                                  className="h-3.5 w-3.5 text-brand-maroon focus:ring-brand-maroon border-gray-300 rounded cursor-pointer"
                                />
                                <span className="text-xs font-bold text-brand-maroon bg-red-100/60 px-1.5 py-0.5 rounded">
                                  {pso.id}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Selected
                                </span>
                              )}
                            </div>
                            <h3 className="text-xs font-bold text-gray-900 leading-snug mb-1">
                              {pso.title}
                            </h3>
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                              {pso.desc}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                            <span className="text-gray-400 font-medium">Outcome {pso.psoNumber}</span>
                            <span className={`font-semibold ${isSelected ? 'text-brand-maroon' : 'text-gray-500'}`}>
                              {isSelected ? 'Included' : 'Click to select'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        {/* SECTION E - FACULTY MENTOR DETAILS */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">E. Faculty Mentor Details</h2>
            <span className="text-[11px] text-white/80 hidden sm:inline">Project Guide &amp; Technical Advisor</span>
          </div>
          <div className="p-4 sm:p-5 space-y-3.5">
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-md text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">Role Clarification:</span> The <strong>Faculty Mentor</strong> is the subject professor or teacher directly guiding your technical project implementation. This is separate from the department <strong>PBL Coordinator</strong> (assigned in the next section) who oversees academic evaluation and certification.
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Faculty Mentor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Dr. S. K. Patil"
                {...register("faculty_mentor_name", {
                  required: "Faculty Mentor Name is required",
                  validate: v => !!v?.trim() || "Faculty Mentor Name cannot be blank or whitespace only"
                })}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-brand-maroon focus:ring-1 focus:ring-brand-maroon outline-none text-gray-800"
              />
              {errors.faculty_mentor_name && (
                <span className="text-red-500 text-xs mt-1 block">{errors.faculty_mentor_name.message}</span>
              )}
              <span className="text-[11px] text-gray-500 mt-1 block">
                Enter the full academic name of your faculty mentor.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION F - PBL COORDINATOR MAPPING */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5">
            <h2 className="text-sm font-semibold text-white tracking-wide">F. PBL Coordinator Mapping</h2>
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

        {/* SECTION G - TEAM MEMBERS */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide">G. Team Members</h2>
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

        {/* SECTION H - PROJECT SCREENSHOTS */}
        <div className="bg-white rounded-md shadow-2xs border border-gray-200/90 overflow-hidden">
          <div className="bg-brand-maroon px-5 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4" /> H. Project Screenshots
            </h2>
            <span className="text-[11px] text-white/80 hidden sm:inline">Upload 2–4 screenshots</span>
          </div>
          <div className="p-4 sm:p-5">
            {/* Upload Button or Max Limit Notice */}
            {screenshots.length < MAX_SCREENSHOTS ? (
              <>
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center gap-1.5 w-fit cursor-pointer px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-md text-gray-700 font-medium text-xs transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {screenshots.length === 0 ? `Choose Screenshots (Max ${MAX_SCREENSHOTS})` : `Add More (${screenshots.length}/${MAX_SCREENSHOTS})`}
                </label>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
              </>
            ) : (
              <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 text-xs font-medium flex items-center gap-2 w-fit">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Maximum limit of 4 project screenshots reached. Remove a screenshot to add another.</span>
              </div>
            )}

            {/* Preview Grid */}
            {screenshots.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                        className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition shadow cursor-pointer"
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
                <AlertCircle className="w-3 h-3 text-gray-400 shrink-0" /> At least 2 screenshots are required (maximum 4 allowed, JPEG, PNG, WebP up to 10MB each).
              </p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS: PREVIEW & SUBMIT */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm rounded-md border border-gray-300 shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-gray-600" />
            Preview Report
          </button>
          <button
            type="submit"
            disabled={loading || role === 'teacher' || role === 'unapproved_teacher'}
            className="w-full sm:flex-1 py-2.5 px-6 bg-brand-maroon hover:bg-[#6e2e2e] text-white font-semibold text-sm rounded-md shadow-2xs transition disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Submitting...' : (role === 'teacher' || role === 'unapproved_teacher') ? 'Student Account Required to Submit' : 'Submit Project for Approval'}
          </button>
        </div>
      </form>
    </div>

    {/* Form Preview Modal */}
    {showPreview && (
      <ProjectDocumentViewer
        project={{
          ...formValues,
          isDraft: true,
          student_id: profile?.user_id,
          students: {
            full_name: profile?.full_name || 'Student Name',
            roll_number: profile?.roll_number || 'N/A',
            department: profile?.department || 'Computer Engineering',
            year: profile?.year || 'BE'
          },
          mentor_name: teachers.find(t => t.user_id === formValues.mentor_id)?.full_name || 'Assigned Coordinator',
          screenshot_urls: screenshots.map(s => s.preview),
          document_url: certificates.length > 0 
            ? (certificates.length === 1 ? certificates[0].preview : JSON.stringify(certificates.map(c => c.preview || c.name)))
            : null,
          type: formValues.type === 'Complex Engineering' ? 'Complex Engineering Problems' : formValues.type
        }}
        onClose={() => setShowPreview(false)}
      />
    )}
  </DashboardLayout>
  );
}
