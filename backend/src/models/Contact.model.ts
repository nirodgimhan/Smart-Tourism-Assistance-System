
import mongoose, {
  Schema,
  model
} from "mongoose";

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000
    },

    status: {
      type: String,
      enum: ["new", "reviewed", "closed"],
      default: "new"
    }
  },
  {
    timestamps: true
  }
);

contactSchema.index({ createdAt: -1 });

export const Contact =
  mongoose.models.Contact ||
  model("Contact", contactSchema);
