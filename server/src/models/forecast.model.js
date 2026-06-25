import mongoose from "mongoose";
import { COMPLAINT_CATEGORIES } from "./complaint.model.js";

const { Schema, model } = mongoose;

export const FORECAST_STATUS = {
  ACTIVE: "active",       
  ACKNOWLEDGED: "acknowledged", 
  EXPIRED: "expired",     
  CONFIRMED: "confirmed", 
};

export const FORECAST_TRIGGERS = {
  SEASONAL: "seasonal",       
  WEATHER: "weather",         
  VELOCITY: "velocity",       
  COMBINED: "combined",       
};

const forecastSchema = new Schema(
  {
    wardId: {
      type: Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Ward reference is required"],
    },

    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: [true, "Complaint category for forecast is required"],
    },

    
    predictedStartDate: {
      type: Date,
      required: true,
    },

    predictedEndDate: {
      type: Date,
      required: true,
    },

    
    
    expectedMultiplier: {
      type: Number,
      min: 1,
      default: null,
    },

    
    trigger: {
      type: String,
      enum: Object.values(FORECAST_TRIGGERS),
      required: true,
    },

    
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },

    
    
    
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    
    weatherContext: {
      condition: String,        
      forecastMm: Number,       
      forecastDate: Date,
      historicalThresholdMm: Number, 
    },

    
    historicalYears: {
      type: [Number], 
      default: [],
    },

    baselineAvgComplaints: {
      type: Number, 
      default: null,
    },

    
    status: {
      type: String,
      enum: Object.values(FORECAST_STATUS),
      default: FORECAST_STATUS.ACTIVE,
    },

    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acknowledgedAt: {
      type: Date,
      default: null,
    },

    
    actualComplaintsInWindow: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

forecastSchema.index({ wardId: 1, status: 1 });                        
forecastSchema.index({ predictedStartDate: 1, status: 1 });            
forecastSchema.index({ wardId: 1, category: 1, createdAt: -1 });       
forecastSchema.index({ confidence: -1, status: 1 });                   

forecastSchema.statics.expireOldForecasts = function () {
  return this.updateMany(
    { status: FORECAST_STATUS.ACTIVE, predictedEndDate: { $lt: new Date() } },
    { $set: { status: FORECAST_STATUS.EXPIRED } }
  );
};

const Forecast = model("Forecast", forecastSchema);

export default Forecast;
