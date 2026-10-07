/**
 * toJSON plugin — Shapes every document the way the React app expects:
 * `_id` becomes a string `id`, and `__v` and `password` are never sent.
 * Virtuals (like an appointment's populated `pet`) are included.
 */
export default function toJSONPlugin(schema) {
  const existing = schema.options.toJSON?.transform;
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(doc, ret, options) {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.password;
      return typeof existing === 'function' ? existing(doc, ret, options) : ret;
    },
  });
}
