import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true, // Ensures only one document per setting type
    enum: ['logo', 'footer', 'general', 'notifications', 'store', 'security']
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Flexible structure for different setting types
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String, // Store user ID who updated
    required: true
  }
}, {
  timestamps: true
});

// The following line has been removed to fix the duplicate index warning:
// SettingsSchema.index({ type: 1 });

// Add a method to get default footer data
SettingsSchema.statics.getDefaultFooter = function() {
  return {
    companyInfo: {
      description: "Baby Bear is dedicated to providing high-quality, safe, and reliable products for your little one. Since 2020, we've been committed to supporting parents with essentials that promote healthy growth and happiness. Trust us to be there for every step of your baby's journey.",
      establishedYear: "2020"
    },
    contact: {
      phone: "078 223 444",
      email: "",
      address: "",
      mapUrl: "https://maps.app.goo.gl/mCgK7xcU3r61Z3S5A",
      mapLabel: "VCT Baby Bear"
    },
    links: {
      company: [
        { label: "Home", url: "/" },
        { label: "About us", url: "/about" },
        { label: "Contact us", url: "/contact" },
        { label: "Privacy policy", url: "/privacy" }
      ],
      social: [
        { platform: "facebook", url: "", icon: "facebook" },
        { platform: "instagram", url: "", icon: "instagram" },
        { platform: "twitter", url: "", icon: "twitter" }
      ]
    },
    copyright: {
      year: new Date().getFullYear(),
      text: "Baby Bear. All Right Reserved."
    },
    isVisible: true
  };
};

// Add a method to get default logo data
SettingsSchema.statics.getDefaultLogo = function() {
  return {
    url: null,
    width: null,
    height: null,
    format: null,
    size: null,
    filename: null,
    uploadedAt: null
  };
};

// Pre-save middleware to update the updatedAt field
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-findOneAndUpdate middleware to update the updatedAt field
SettingsSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

export default Settings;