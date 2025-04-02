
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, KeyRound, Mail, Moon, Sun, ArrowLeft } from "lucide-react";

const usernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50)
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type UsernameFormValues = z.infer<typeof usernameSchema>;
type EmailFormValues = z.infer<typeof emailSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const UserSettings: React.FC = () => {
  const { user, updateUsername, updateEmail, updatePassword, isDarkMode, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: user?.username || ""
    }
  });

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || ""
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  const handleGoBack = () => {
    navigate(-1);
  };

  const onSubmitUsername = async (data: UsernameFormValues) => {
    setIsUpdatingUsername(true);
    try {
      const success = await updateUsername(data.username);
      if (success) {
        usernameForm.reset({ username: data.username });
      }
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const onSubmitEmail = async (data: EmailFormValues) => {
    setIsUpdatingEmail(true);
    try {
      const success = await updateEmail(data.email);
      if (success) {
        emailForm.reset({ email: data.email });
      }
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    try {
      const success = await updatePassword(data.password);
      if (success) {
        passwordForm.reset({ password: "", confirmPassword: "" });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container max-w-3xl pt-20 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <User className="h-8 w-8 mr-2 text-scrum-accent" />
          <h1 className="text-2xl font-bold">User Settings</h1>
        </div>
        <Button 
          onClick={handleGoBack} 
          variant="outline" 
          className="flex items-center gap-2 border-scrum-border hover:bg-scrum-accent hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="space-y-8">
        {/* Username Section */}
        <div className="scrum-card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-scrum-text-secondary" />
            Update Username
          </h2>
          <Form {...usernameForm}>
            <form onSubmit={usernameForm.handleSubmit(onSubmitUsername)} className="space-y-4">
              <FormField
                control={usernameForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isUpdatingUsername || !usernameForm.formState.isDirty}
                className="scrum-button"
              >
                {isUpdatingUsername ? "Updating..." : "Update Username"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Email Section */}
        <div className="scrum-card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-scrum-text-secondary" />
            Update Email
          </h2>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isUpdatingEmail || !emailForm.formState.isDirty}
                className="scrum-button"
              >
                {isUpdatingEmail ? "Updating..." : "Update Email"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Password Section */}
        <div className="scrum-card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <KeyRound className="h-5 w-5 mr-2 text-scrum-text-secondary" />
            Update Password
          </h2>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isUpdatingPassword || !passwordForm.formState.isDirty}
                className="scrum-button"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Theme Preference */}
        <div className="scrum-card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {isDarkMode ? (
              <Moon className="h-5 w-5 mr-2 text-scrum-text-secondary" />
            ) : (
              <Sun className="h-5 w-5 mr-2 text-scrum-text-secondary" />
            )}
            Theme Preference
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Light Mode</h3>
              <p className="text-sm text-scrum-text-secondary">Switch between dark and light mode</p>
            </div>
            <Switch 
              checked={!isDarkMode} 
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-scrum-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
