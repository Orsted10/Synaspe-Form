"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import VideoBackground from "@/components/VideoBackground";
import ParticleField from "@/components/ParticleField";
import ProgressBar from "@/components/ProgressBar";
import StepWrapper, { childVariants } from "@/components/StepWrapper";
import { submitMemberForm, type MemberFormData } from "@/lib/supabase";
import confetti from "canvas-confetti";

// ── Types & Initial State ──────────────────────────────
const initialData: MemberFormData = {
  full_name: "",
  uid: "",
  email: "",
  course_year: "",
  contact_number: "",
  areas_of_interest: [],
  collaboration_preferences: [],
  club_expectations: "",
  expected_outcomes: "",
  additional_ideas: "",
};

// Map questions to terminal file names
const terminalFiles = [
  "INIT_SEQUENCE.sys",
  "IDENTITY_MODULE.ts",
  "UID_VALIDATION.rs",
  "CONTACT_MATRIX.py",
  "DOMAIN_ALLOCATION.cpp",
  "PROTOCOL_PREFS.go",
  "EXPECTATION_LOG.txt",
  "OUTCOME_PREDICTION.md",
  "OVERRIDE_IDEAS.json",
  "FINAL_CHECKSUM.sh",
  "SYSTEM_READY.exe"
];

// ── Scramble Text Hook ─────────────────────────────────
const chars = "!<>-_\\\\/[]{}—=+*^?#________";
function ScrambleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");
  const [isScrambling, setIsScrambling] = useState(true);

  useEffect(() => {
    let iteration = 0;
    setIsScrambling(true);
    
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return letter;
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsScrambling(false);
      }

      iteration += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="scramble-text">
      {displayText.split("").map((char, i) => (
        <span key={i} className={`char ${isScrambling && i >= Math.floor(displayText.length * 0.7) ? 'scrambling' : ''}`}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

const Header = ({ title, hint, step }: { title: string, hint: string, step: number }) => (
  <motion.div variants={childVariants}>
    <div className="question-number">
      root@{terminalFiles[step]}
    </div>
    <h2 className="question-text">
      <ScrambleText text={title} />
    </h2>
    <p className="question-hint">{hint}</p>
  </motion.div>
);

export default function Home() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [formData, setFormData] = useState<MemberFormData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TOTAL_STEPS = 10; // 0-10
  const progress = (step / TOTAL_STEPS) * 100;

  // ── Navigation Logic ────────────────────────────────
  const goNext = () => {
    if (validateStep(step)) {
      setDirection(1);
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  // Keyboard navigation (Enter to advance)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && step > 0 && step < 9) {
        // Don't auto-advance on textareas if Shift is held (allow newlines)
        if (e.target instanceof HTMLTextAreaElement && e.shiftKey) return;
        if (e.target instanceof HTMLTextAreaElement) {
           e.preventDefault(); // Stop newline if just pressing Enter
           goNext();
           return;
        }
        
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, formData]);

  // ── Validation ──────────────────────────────────────
  const validateStep = (currentStep: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    if (currentStep === 1 && !formData.full_name.trim()) {
      newErrors.full_name = "FATAL: IDENTIFIER REQUIRED";
      isValid = false;
    }
    if (currentStep === 2 && !formData.uid.trim()) {
      newErrors.uid = "FATAL: UID CANNOT BE NULL";
      isValid = false;
    }
    if (currentStep === 3) {
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = "ERR: INVALID PROTOCOL SYNTAX";
        isValid = false;
      }
      if (!formData.course_year.trim()) {
        newErrors.course_year = "ERR: VERSION MISMATCH";
        isValid = false;
      }
      if (!formData.contact_number.trim()) {
        newErrors.contact_number = "ERR: PING FAILED";
        isValid = false;
      }
    }
    if (currentStep === 4 && formData.areas_of_interest.length === 0) {
      newErrors.areas_of_interest = "WARN: MUST SELECT AT LEAST ONE NODE";
      isValid = false;
    }
    if (currentStep === 5 && formData.collaboration_preferences.length === 0) {
      newErrors.collaboration_preferences = "WARN: TOPOLOGY REQUIRED";
      isValid = false;
    }
    if (currentStep === 6 && !formData.club_expectations.trim()) {
      newErrors.club_expectations = "FATAL: PARAMETER REQUIRED";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // ── Handlers ────────────────────────────────────────
  const handleInput = (field: keyof MemberFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleArrayItem = (field: "areas_of_interest" | "collaboration_preferences", item: string) => {
    setFormData((prev) => {
      const array = prev[field];
      const newArray = array.includes(item)
        ? array.filter((i) => i !== item)
        : [...array, item];
      
      if (errors[field]) setErrors((prevErrs) => ({ ...prevErrs, [field]: "" }));
      return { ...prev, [field]: newArray };
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const { success, error } = await submitMemberForm(formData);
      if (!success) throw new Error(error || "Submission failed");
      
      // Success!
      setDirection(1);
      setStep(10);
      
      // Fire confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#7c3aed', '#06b6d4', '#22c55e']
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#7c3aed', '#06b6d4', '#22c55e']
        });
      }, 250);

    } catch (err) {
      console.error("Submission failed:", err);
      alert("System failure during database sync. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Helpers ──────────────────────────────────
  const renderNav = (canSkip = false) => (
    <motion.div variants={childVariants} className="nav-buttons">
      <button onClick={goBack} className="nav-button back">
        <span className="arrow-icon">←</span> cd ..
      </button>
      
      <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
        {canSkip && (
          <button onClick={() => {
            handleInput(step === 7 ? 'expected_outcomes' : 'additional_ideas', "SKIPPED");
            goNext();
          }} className="skip-button">
            bypass -f
          </button>
        )}
        <button onClick={goNext} className="nav-button next">
          ./continue.sh <span className="arrow-icon">→</span>
        </button>
      </div>
    </motion.div>
  );

  // ── Step Components ─────────────────────────────────
  const renderWelcome = () => (
    <div className="welcome-screen">
      <motion.div variants={childVariants}>
        <div className="welcome-badge">
          <span className="dot" />
          CONNECTION SECURE
        </div>
      </motion.div>
      
      <motion.div variants={childVariants} className="welcome-title">
        <span className="gradient-text" data-text="SYNAPSE">SYNAPSE</span>
        <div className="welcome-club">SOCIETY</div>
      </motion.div>
      
      <motion.div variants={childVariants} className="terminal-line">
        <span className="prompt">root@synapse:~$</span>
        <span>./join_club.sh</span>
        <span className="cursor-blink"></span>
      </motion.div>
      
      <motion.p variants={childVariants} className="welcome-subtitle">
        Access granted to the neural network. A community driven by peer-to-peer learning, knowledge sharing, and building the future — together. Compile your identity below.
      </motion.p>
      
      <motion.div variants={childVariants} className="welcome-divider" />
      
      <motion.button 
        variants={childVariants}
        className="begin-button"
        onClick={() => {
          setDirection(1);
          setStep(1);
        }}
      >
        [ Y / n ] ACCEPT <span className="arrow">→</span>
      </motion.button>
    </div>
  );

  const interestOptions = [
    { id: "Web Development", img: "/img-webdev.png", text: "Web Development", gridClass: "domain-webdev" },
    { id: "AI & Machine Learning", img: "/img-aiml.png", text: "AI & Machine Learning", gridClass: "domain-ai" },
    { id: "Systems Programming", img: "/img-systems.png", text: "Systems Programming", gridClass: "domain-sys" },
    { id: "Open Source Contribution", img: "/img-opensource.png", text: "Open Source", gridClass: "domain-os" },
    { id: "Event Management / Leadership", img: "/img-events.png", text: "Event Management", gridClass: "domain-event" }
  ];

  const collabOptions = [
    { id: "Structured, project-based groups (Squads & Sprints)", img: "/collab_project.png", text: "Structured & Project-Based", gridClass: "collab-struct" },
    { id: "Open-ended peer-to-peer learning and mentoring", img: "/collab_peer.png", text: "Peer-to-peer Mentoring", gridClass: "collab-peer" },
    { id: "Attending workshops and guest lectures", img: "/collab_workshop.png", text: "Workshops & Lectures", gridClass: "collab-work" },
  ];

  return (
    <main className="main-container">
      <VideoBackground />
      <ParticleField />
      
      {step > 0 && <ProgressBar current={step} total={TOTAL_STEPS} />}
      
      {step > 0 && step < 10 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="step-counter"
        >
          STEP <span className="current">0{step}</span> / 09
        </motion.div>
      )}

      <StepWrapper stepKey={step} direction={direction}>
        {/* STEP 0: WELCOME */}
        {step === 0 && renderWelcome()}

        {/* STEP 1: NAME */}
        {step === 1 && (
          <>
            <Header step={step} title="What's your full name?" hint="// What should we call you?" />
            <motion.div variants={childVariants} className="input-group">
              <input
                type="text"
                autoFocus
                className={`animated-input ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Enter your real full name"
                value={formData.full_name}
                onChange={(e) => handleInput("full_name", e.target.value)}
              />
              <label className="input-label">FullName.String</label>
              <div className="input-glow" />
              {errors.full_name && <div className="error-message">{errors.full_name}</div>}
            </motion.div>
            {renderNav()}
          </>
        )}

        {/* STEP 2: UID */}
        {step === 2 && (
          <>
            <Header step={step} title="Enter your UID" hint="// Your University Roll Number" />
            <motion.div variants={childVariants} className="input-group">
              <input
                type="text"
                autoFocus
                className={`animated-input ${errors.uid ? 'input-error' : ''}`}
                placeholder="e.g. 25LBCS3067"
                value={formData.uid}
                onChange={(e) => handleInput("uid", e.target.value)}
              />
              <label className="input-label">UID.Hash</label>
              <div className="input-glow" />
              {errors.uid && <div className="error-message">{errors.uid}</div>}
            </motion.div>
            {renderNav()}
          </>
        )}

        {/* STEP 3: CONTACT INFO */}
        {step === 3 && (
          <>
            <Header step={step} title="Communication Protocol" hint="How do we reach you?" />
            <motion.div variants={childVariants} className="multi-input-group">
              <div className="input-group" style={{marginTop: 0}}>
                <input
                  type="email"
                  autoFocus
                  className={`animated-input ${errors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInput("email", e.target.value)}
                />
                <label className="input-label">Email.Protocol</label>
                <div className="input-glow" />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="input-group" style={{marginTop: 0}}>
                <input
                  type="text"
                  className={`animated-input ${errors.course_year ? 'input-error' : ''}`}
                  placeholder="Enter Course & Year (e.g. B.Tech, 2nd Year)"
                  value={formData.course_year}
                  onChange={(e) => handleInput("course_year", e.target.value)}
                />
                <label className="input-label">Course.Version</label>
                <div className="input-glow" />
                {errors.course_year && <div className="error-message">{errors.course_year}</div>}
              </div>

              <div className="input-group" style={{marginTop: 0}}>
                <input
                  type="tel"
                  className={`animated-input ${errors.contact_number ? 'input-error' : ''}`}
                  placeholder="Enter WhatsApp Number"
                  value={formData.contact_number}
                  onChange={(e) => handleInput("contact_number", e.target.value)}
                />
                <label className="input-label">Ping.Port (WhatsApp Number)</label>
                <div className="input-glow" />
                {errors.contact_number && <div className="error-message">{errors.contact_number}</div>}
              </div>
            </motion.div>
            {renderNav()}
          </>
        )}

        {/* STEP 4: INTERESTS (IMAGES) */}
        {step === 4 && (
          <>
            <Header step={step} title="Allocate Domains" hint="// What areas are you interested in? (Select multiple)" />
            <motion.div variants={childVariants} className="domains-grid">
              {interestOptions.map((opt) => {
                const isSelected = formData.areas_of_interest.includes(opt.id);
                return (
                  <div 
                    key={opt.id}
                    className={`image-card ${isSelected ? 'selected' : ''} ${opt.gridClass}`}
                    onClick={() => toggleArrayItem("areas_of_interest", opt.id)}
                  >
                    <div className="card-image-wrapper">
                      <img src={opt.img} alt={opt.id} />
                    </div>
                    <span className="card-text">{opt.text}</span>
                    <div className="card-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                );
              })}
              
              <div className="image-card domain-other">
                <div className="other-input-container">
                  <input
                    type="text"
                    className="other-input"
                    placeholder=">_ Other (Specify)"
                    onChange={(e) => {
                      const val = e.target.value;
                      const withoutOthers = formData.areas_of_interest.filter(i => interestOptions.map(o => o.id).includes(i));
                      if (val) {
                        handleInput("areas_of_interest", [...withoutOthers, `Other: ${val}`]);
                      } else {
                        handleInput("areas_of_interest", withoutOthers);
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
            {errors.areas_of_interest && <motion.div variants={childVariants} className="error-message">{errors.areas_of_interest}</motion.div>}
            {renderNav()}
          </>
        )}

        {/* STEP 5: COLLAB PREFS */}
        {step === 5 && (
          <>
            <Header step={step} title="Network Topology" hint="// How do you prefer to collaborate and learn?" />
            <motion.div variants={childVariants} className="collab-grid">
              {collabOptions.map((opt) => {
                const isSelected = formData.collaboration_preferences.includes(opt.id);
                return (
                  <div 
                    key={opt.id}
                    className={`image-card ${isSelected ? 'selected' : ''} ${opt.gridClass}`}
                    onClick={() => toggleArrayItem("collaboration_preferences", opt.id)}
                  >
                    <div className="card-image-wrapper">
                      <img src={opt.img} alt={opt.id} />
                    </div>
                    <span className="card-text">{opt.text}</span>
                    <div className="card-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  </div>
                );
              })}

              <div className="image-card collab-other">
                <div className="other-input-container">
                  <input
                    type="text"
                    className="other-input"
                    placeholder=">_ Other (Specify)"
                    onChange={(e) => {
                      const val = e.target.value;
                      const withoutOthers = formData.collaboration_preferences.filter(i => collabOptions.map(o => o.id).includes(i));
                      if (val) {
                        handleInput("collaboration_preferences", [...withoutOthers, `Other: ${val}`]);
                      } else {
                        handleInput("collaboration_preferences", withoutOthers);
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
            {errors.collaboration_preferences && <motion.div variants={childVariants} className="error-message">{errors.collaboration_preferences}</motion.div>}
            {renderNav()}
          </>
        )}

        {/* STEP 6: EXPECTATIONS */}
        {step === 6 && (
          <>
            <Header step={step} title="System Expectations" hint="// What do you hope to get out of joining the club?" />
            <motion.div variants={childVariants} className="textarea-group">
              <textarea
                autoFocus
                className={`animated-textarea ${errors.club_expectations ? 'input-error' : ''}`}
                placeholder="/* I expect to learn, build, collaborate... */"
                value={formData.club_expectations}
                onChange={(e) => handleInput("club_expectations", e.target.value)}
              />
              {errors.club_expectations && <div className="error-message">{errors.club_expectations}</div>}
            </motion.div>
            {renderNav()}
          </>
        )}

        {/* STEP 7: OUTCOMES */}
        {step === 7 && (
          <>
            <Header step={step} title="Outcome Prediction" hint="// Are there specific skills or achievements you aim for?" />
            <motion.div variants={childVariants} className="textarea-group">
              <textarea
                autoFocus
                className="animated-textarea"
                placeholder="/* Specific skills or achievements you want... */"
                value={formData.expected_outcomes === "SKIPPED" ? "" : formData.expected_outcomes}
                onChange={(e) => handleInput("expected_outcomes", e.target.value)}
              />
            </motion.div>
            {renderNav(true)}
          </>
        )}

        {/* STEP 8: IDEAS */}
        {step === 8 && (
          <>
            <Header step={step} title="Override Logic" hint="// Do you have any ideas for events, workshops, or projects?" />
            <motion.div variants={childVariants} className="textarea-group">
              <textarea
                autoFocus
                className="animated-textarea"
                placeholder="/* Any events, workshops, or project ideas you have... */"
                value={formData.additional_ideas === "SKIPPED" ? "" : formData.additional_ideas}
                onChange={(e) => handleInput("additional_ideas", e.target.value)}
              />
            </motion.div>
            {renderNav(true)}
          </>
        )}

        {/* STEP 9: REVIEW */}
        {step === 9 && (
          <>
            <Header step={step} title="Compile & Run" hint="// Review your answers before submitting" />
            <motion.div variants={childVariants} className="review-container">
              {[
                { label: "ID.String", val: formData.full_name, st: 1 },
                { label: "UID.Hash", val: formData.uid, st: 2 },
                { label: "Protocol", val: formData.email, st: 3 },
                { label: "Domains", val: formData.areas_of_interest, st: 4, isArr: true },
                { label: "Topology", val: formData.collaboration_preferences, st: 5, isArr: true },
                { label: "Expectations", val: formData.club_expectations, st: 6, isLong: true },
                { label: "Outcomes", val: formData.expected_outcomes === "SKIPPED" ? "None" : formData.expected_outcomes, st: 7, isLong: true },
                { label: "Ideas", val: formData.additional_ideas === "SKIPPED" ? "None" : formData.additional_ideas, st: 8, isLong: true },
              ].map((item, idx) => (
                <div key={idx} className="review-item" onClick={() => { setDirection(-1); setStep(item.st); }}>
                  <div className="review-item-label">{item.label}</div>
                  <div className={`review-item-value ${item.isLong ? 'long-text' : ''}`}>
                    {item.isArr 
                      ? (item.val as string[]).map((tag, i) => <span key={i} className="chip-tag">{tag}</span>)
                      : item.val}
                  </div>
                </div>
              ))}
              <div className="review-edit-hint">Click any module to rewrite</div>
            </motion.div>
            
            <motion.div variants={childVariants} className="nav-buttons">
              <button onClick={goBack} className="nav-button back" disabled={isSubmitting}>
                <span className="arrow-icon">←</span> Abort
              </button>
              <button onClick={submitForm} className="nav-button submit" disabled={isSubmitting}>
                {isSubmitting ? <div className="loading-spinner"/> : 'EXECUTE COMMIT'}
              </button>
            </motion.div>
          </>
        )}

        {/* STEP 10: COMPLETION */}
        {step === 10 && (
          <div className="completion-screen">
            <motion.div variants={childVariants} className="completion-checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </motion.div>
            <motion.div variants={childVariants}>
              <div className="question-number" style={{justifyContent: 'center', marginBottom: '12px'}}>STATUS_CODE: 200_OK</div>
              <h2 className="completion-title gradient-text">System Synced</h2>
            </motion.div>
            <motion.p variants={childVariants} className="completion-message">
              Your profile has been successfully compiled into the network. 
              Await further instructions via your selected protocols.
            </motion.p>
          </div>
        )}
      </StepWrapper>
    </main>
  );
}
