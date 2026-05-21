import api from "./axiosInstance";

export interface ProfileImageUploadResponse {
  success: boolean;
  status: number;
  data: {
    profile_image_url: string;
  };
  message: string;
}

/**
 * Upload profile image file
 * This uploads the image and returns the URL
 */
export const uploadProfileImage = async (file: File): Promise<ProfileImageUploadResponse> => {
  const formData = new FormData();
  formData.append("profile_image", file);

  const res = await api.post<ProfileImageUploadResponse>(
    "/profile/upload-image",
    formData
  );

  return res.data;
};
