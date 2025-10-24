// js/match-engine.js
// 💡 Lumion Jobs-AI Local Matching Engine (Offline Edition)

// ----------------------
//  Helper functions
// ----------------------
function normalize(text) {
  return (text || "").toString().trim().toLowerCase();
}

function extractSalary(value) {
  if (!value) return [0, 0];
  const parts = value.split("–").map(v => parseInt(v.replace(/[^\d]/g, ""), 10));
  return [parts[0] || 0, parts[1] || parts[0] || 0];
}

function locationMatch(jobLoc, userLoc) {
  return normalize(jobLoc).includes(normalize(userLoc)) || normalize(userLoc).includes(normalize(jobLoc));
}

function skillMatch(userSkills, jobSkills) {
  if (!jobSkills || !jobSkills.length) return 1;
  let matchCount = 0;
  jobSkills.forEach(skill => {
    if (userSkills.map(normalize).includes(normalize(skill))) matchCount++;
  });
  return matchCount / jobSkills.length;
}

// ----------------------
//  Main Matching Logic
// ----------------------
function matchJobToUser(job, user) {
  let score = 0;
  const reasons = [];

  // Skill match (40%)
  const skillScore = skillMatch(user.skills, job.skills || job.requiredSkills) * 40;
  score += skillScore;
  if (skillScore > 25) reasons.push("Strong skill alignment");

  // Location match (20%)
  if (locationMatch(job.location, user.preferences.location)) {
    score += 20;
    reasons.push("Location match");
  }

  // Work mode (15%)
  if (normalize(job.jobType) === normalize(user.preferences.jobType)) {
    score += 15;
    reasons.push("Preferred work mode");
  }

  // Salary (15%)
  const [jobMin, jobMax] = extractSalary(job.salaryRange);
  const [userMin, userMax] = extractSalary(user.preferences.salaryRange);
  if (jobMin >= userMin && jobMin <= userMax) {
    score += 15;
    reasons.push("Salary within range");
  }

  // Experience (10%)
  if (normalize(job.experienceLevel) === normalize(user.experienceLevel)) {
    score += 10;
    reasons.push("Experience level match");
  }

  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    score: Math.min(100, Math.round(score)),
    reasons
  };
}

// ----------------------
//  Full AI Engine
// ----------------------
function runMatchingEngine() {
  const results = [];

  users.forEach(user => {
    if (!user.autoApply) return; // only auto-apply users

    const matches = jobs
      .map(job => matchJobToUser(job, user))
      .filter(j => j.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    results.push({
      userId: user.id,
      userName: user.name,
      topMatches: matches
    });
  });

  console.log("✅ Matching complete:", results);
  return results;
}
