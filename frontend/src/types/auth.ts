export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}
