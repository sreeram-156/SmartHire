const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "smartHireAccessToken";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(
  path,
  {
    method = "GET",
    body,
    headers = {},
    ...options
  } = {}
) {
  const requestHeaders = { ...headers };
  const token = getAccessToken();

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
      {
        ...options,
        method,
        headers: requestHeaders,
        ...(body !== undefined
          ? { body: isFormData ? body : JSON.stringify(body) }
          : {}),
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to SmartHire's backend. Check that FastAPI is running."
    );
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.detail || data.message || "The request failed."
        : data || "The request failed.";

    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }

  return data;
}

export const authAPI = {
  signup: (userData) =>
    apiRequest("/auth/signup", {
      method: "POST",
      body: userData,
    }),

  recruiterSignup: (recruiterData) =>
    apiRequest("/auth/recruiter-signup", {
      method: "POST",
      body: recruiterData,
    }),

  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    }),

  me: () => apiRequest("/auth/me"),
};

export const jobsAPI = {
  getAll: () => apiRequest("/jobs/"),

  getMyJobs: () => apiRequest("/jobs/my-jobs"),

  create: (jobData) =>
    apiRequest("/jobs/", {
      method: "POST",
      body: jobData,
    }),

  // Update an existing job in the backend database.
  update: (jobId, jobData) =>
    apiRequest(`/jobs/${Number(jobId)}`, {
      method: "PUT",
      body: jobData,
    }),

  // Delete an existing job from the backend database.
  delete: (jobId) =>
    apiRequest(`/jobs/${Number(jobId)}`, {
      method: "DELETE",
    }),
};

export const applicationsAPI = {
  apply: (applicationData) =>
    apiRequest("/applications/", {
      method: "POST",
      body: applicationData,
    }),

  getMyApplications: () =>
    apiRequest("/applications/my-applications"),

  getByJob: (jobId) =>
    apiRequest(`/applications/job/${jobId}`),

  getJobDetails: (jobId) =>
    apiRequest(`/applications/job/${jobId}/details`),

  updateStatus: (applicationId, status) =>
    apiRequest(`/applications/${applicationId}/status`, {
      method: "PUT",
      body: { status },
    }),

  uploadResume: (jobId, resumeFile) => {
    const formData = new FormData();

    formData.append("job_id", String(jobId));
    formData.append("resume", resumeFile);

    return apiRequest("/applications/upload", {
      method: "POST",
      body: formData,
    });
  },
};

export const adminAPI = {
  getStats: () => apiRequest("/admin/stats"),
  getUsers: () => apiRequest("/admin/users"),
  getRecruiters: () => apiRequest("/admin/recruiters"),
  getJobs: () => apiRequest("/admin/jobs"),

  approveRecruiter: (recruiterId) =>
    apiRequest(`/admin/recruiters/${recruiterId}/approve`, {
      method: "PUT",
    }),

  rejectRecruiter: (recruiterId) =>
    apiRequest(`/admin/recruiters/${recruiterId}/reject`, {
      method: "PUT",
    }),

  activateRecruiter: (recruiterId) =>
    apiRequest(`/admin/recruiters/${recruiterId}/activate`, {
      method: "PUT",
    }),

  deactivateRecruiter: (recruiterId) =>
    apiRequest(`/admin/recruiters/${recruiterId}/deactivate`, {
      method: "PUT",
    }),

  approveJob: (jobId) =>
    apiRequest(`/admin/jobs/${jobId}/approve`, {
      method: "PUT",
    }),

  rejectJob: (jobId) =>
    apiRequest(`/admin/jobs/${jobId}/reject`, {
      method: "PUT",
    }),

  activateUser: (userId) =>
    apiRequest(`/admin/users/${userId}/activate`, {
      method: "PUT",
    }),

  deactivateUser: (userId) =>
    apiRequest(`/admin/users/${userId}/deactivate`, {
      method: "PUT",
    }),

  activateJob: (jobId) =>
    apiRequest(`/admin/jobs/${jobId}/activate`, {
      method: "PUT",
    }),

  deactivateJob: (jobId) =>
    apiRequest(`/admin/jobs/${jobId}/deactivate`, {
      method: "PUT",
    }),

  deleteUser: (userId) =>
    apiRequest(`/admin/users/${userId}`, {
      method: "DELETE",
    }),

  deleteRecruiter: (recruiterId) =>
    apiRequest(`/admin/recruiters/${recruiterId}`, {
      method: "DELETE",
    }),

  deleteJob: (jobId) =>
    apiRequest(`/admin/jobs/${jobId}`, {
      method: "DELETE",
    }),
};

export default apiRequest;