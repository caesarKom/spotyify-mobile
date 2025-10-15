import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    otp: {
      code: {
        type: String,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
        maxlength: [50, "Name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters."],
      },
      avatar: {
        type: String,
        default: null,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      date_of_brith: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
    },
    preferences: {
      favoriteGenres: [
        {
          type: String,
          trim: true,
        },
      ],
      recentlyPlayed: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Music",
        },
      ],
      playlists: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Playlist",
        },
      ],
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    throw error
  }
})

// compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// OTP cleaning method
userSchema.methods.clearOTP = function () {
  this.otp.code = null
  this.otp.expiresAt = null
}

// Method to check if OTP is valid
userSchema.methods.isOTPValid = function () {
  return this.otp.code && this.otp.expiresAt && new Date() < this.otp.expiresAt
}

// Virtual field for full name
userSchema.virtual("fullName").get(function () {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`
  }
  return this.username
})

// Ensure virtual fields are serialized
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password
    delete ret.otp
    return ret
  },
})

userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    { userId: this._id, name: this.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  )
}

userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { userId: this._id, name: this.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  )
}

export default mongoose.model("User", userSchema)
