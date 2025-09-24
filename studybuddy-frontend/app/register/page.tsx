"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Mail, Lock, BookOpen, Users, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { registerUserThunk, resetRegisterState } from "@/store/registerUserSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  // State management for form inputs and UI controls

  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.registerUser);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false) // Toggle password visibility

  const [agreedToTerms, setAgreedToTerms] = useState(false) // Terms agreement checkbox



  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    major: null,
    bio:null,
    profile_pic: null,
    login_type: 'local',
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    general: "",
    check: ""

  })
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      password: "",
      general: "",
      check: ""
    }

    // Validate full name (minimum 2 characters)
    if (!formData.username.trim()) {
      newErrors.fullName = "Full name is required"
    } else if (formData.username.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters"
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate password strength (minimum 8 characters, at least one number)
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ fullName: "", email: "", password: "", general: "" ,check:""})

    // Validate form before submission
    if (!validateForm()) {
      return
    }

    // Check terms agreement
    if (!agreedToTerms) {
      setErrors((prev) => ({ ...prev, check: "Please agree to the Terms & Privacy" }))
      return
    }

    setIsLoading(loading)
    try {

      dispatch(registerUserThunk(formData));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: "Registration failed. Please try again.",
      }))
      console.error("[v0] Registration error:", error)
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (error) {
      setErrors((prev) => ({ ...prev, general: typeof error === "string" ? error : "Something went wrong", }))
    }


    if (user) {
      dispatch(resetRegisterState());
      router.push("/");
    }
  }, [user, router, dispatch, error]);

  //start 

  // // Error handling state
  // const [errors, setErrors] = useState({
  //   fullName: "",
  //   email: "",
  //   password: "",
  //   general: "",
  // })
  // const [isLoading, setIsLoading] = useState(false) // Loading state for form submission

  // // Form validation function
  // const validateForm = () => {
  //   const newErrors = {
  //     fullName: "",
  //     email: "",
  //     password: "",
  //     general: "",
  //   }

  //   // Validate full name (minimum 2 characters)
  //   if (!fullName.trim()) {
  //     newErrors.fullName = "Full name is required"
  //   } else if (fullName.trim().length < 2) {
  //     newErrors.fullName = "Full name must be at least 2 characters"
  //   }

  //   // Validate email format
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  //   if (!email.trim()) {
  //     newErrors.email = "Email is required"
  //   } else if (!emailRegex.test(email)) {
  //     newErrors.email = "Please enter a valid email address"
  //   }

  //   // Validate password strength (minimum 8 characters, at least one number)
  //   if (!password) {
  //     newErrors.password = "Password is required"
  //   } else if (password.length < 8) {
  //     newErrors.password = "Password must be at least 8 characters"
  //   } else if (!/\d/.test(password)) {
  //     newErrors.password = "Password must contain at least one number"
  //   }

  //   setErrors(newErrors)
  //   return !Object.values(newErrors).some((error) => error !== "")
  // }

  // // Handle form submission
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()

  //   // Clear previous errors
  //   setErrors({ fullName: "", email: "", password: "", general: "" })

  //   // Validate form before submission
  //   if (!validateForm()) {
  //     return
  //   }

  //   // Check terms agreement
  //   if (!agreedToTerms) {
  //     setErrors((prev) => ({ ...prev, general: "Please agree to the Terms & Privacy" }))
  //     return
  //   }

  //   setIsLoading(true)

  //   try {
  //     // Simulate API call (replace with actual registration logic)
  //     await new Promise((resolve) => setTimeout(resolve, 2000))

  //     // Handle successful registration
  //     console.log("[v0] Registration successful", { fullName, email })
  //     // Redirect to dashboard or login page
  //   } catch (error) {
  //     // Handle registration errors
  //     setErrors((prev) => ({
  //       ...prev,
  //       general: "Registration failed. Please try again.",
  //     }))
  //     console.error("[v0] Registration error:", error)
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  // Error display component
  const ErrorMessage = ({ error }: { error: string }) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-2 mt-1 text-red-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Top navigation bar with logo and language selector */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-3">
          {/* StudyBuddy logo with purple background */}
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold">StudyBuddy</span>
        </div>
      </div>

      {/* Language selector in top right */}
      <div className="absolute top-6 right-6 z-10">
        <select className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-1 text-sm">
          <option>English</option>
        </select>
      </div>

      {/* Main content area with split-screen layout */}
      <div className="flex min-h-screen">
        {/* Left side - Registration Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Welcome section with heading and description */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Join StudyBuddy!</h1>
              <p className="text-gray-400">Create your account and start collaborating with friends in study groups.</p>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <ErrorMessage error={errors.general} />
              </div>
            )}

            {/* Google Sign-up Button with branded styling */}
            <Button
              variant="outline"
              className="w-full mb-6 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-12 rounded-lg"
              disabled={isLoading}
            >
              {/* Google logo SVG with official brand colors */}
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>

            {/* Divider between OAuth and traditional form */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">OR</span>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Full Name Input Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  {/* User icon positioned absolutely inside input */}
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    type="text"
                    name="username"

                    placeholder="Your full name"
                    value={formData.username}
                    onChange={handleChange}
                    className={`pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12 rounded-lg focus:border-purple-500 focus:ring-purple-500 ${errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    disabled={isLoading}
                  />
                </div>
                <ErrorMessage error={errors.fullName} />
              </div>

              {/* Email Input Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  {/* Mail icon positioned absolutely inside input */}
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12 rounded-lg focus:border-purple-500 focus:ring-purple-500 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    disabled={isLoading}
                  />
                </div>
                <ErrorMessage error={errors.email} />
              </div>

              {/* Password Input Field with visibility toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  {/* Lock icon positioned absolutely inside input */}
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <Input
                    type={showPassword ? "text" : "password"} // Toggle between text and password type
                    placeholder="Create a password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pl-10 pr-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 h-12 rounded-lg focus:border-purple-500 focus:ring-purple-500 ${errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                      }`}
                    disabled={isLoading}
                  />
                  {/* Password visibility toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                    disabled={isLoading}
                  >
                    {/* Show eye-off when password is visible, eye when hidden */}
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <ErrorMessage error={errors.password} />
              </div>

              {/* Terms and Privacy Agreement Checkbox */}
              <div className="flex items-start space-x-3 mt-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    // Clear general error when terms are agreed
                    if (errors.general && e.target.checked) {
                      setErrors((prev) => ({ ...prev, general: "" }))
                    }
                  }}
                  className="mt-1 w-4 h-4 text-purple-600 bg-gray-900 border-gray-700 rounded focus:ring-purple-500 focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  I agree to the{" "}
                  <button type="button" className="text-purple-400 hover:text-purple-300">
                    Terms & Privacy
                  </button>
                </label>
              </div>

              {/* Submit Button - disabled when form is invalid or loading */}
              <Button
                type="submit"
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white h-12 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formData.username || !formData.email || !formData.password || !agreedToTerms || isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Link to login page for existing users */}
            <div className="text-center mt-6">
              <span className="text-gray-400">Already have an account? </span>
              <Link href="/" className="text-purple-400 hover:text-purple-300 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Promotional Content and Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* Statistics and call-to-action section */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">100K+ students. 25K+ study</h2>
            <h2 className="text-4xl font-bold text-gray-400 mb-6">groups created.</h2>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
              Join Now
            </Button>
          </div>

          {/* Animated study group visualization */}
          <div className="relative">
            <div className="w-64 h-64 relative">
              {/* Central study group icon representing collaboration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                  <Users className="w-10 h-10 text-purple-400" />
                </div>
              </div>

              {/* Orbiting colored dots representing different study materials/subjects */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "20s" }}>
                {/* Top dot - purple for main subject */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
                {/* Bottom dot - blue for secondary subject */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">

                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                {/* Left dot - green for resources */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                {/* Right dot - yellow for notes */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>

              {/* Orbital rings to show connection and movement */}
              <div className="absolute inset-4 border border-gray-700 rounded-full opacity-30"></div>
              <div className="absolute inset-8 border border-purple-500/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
