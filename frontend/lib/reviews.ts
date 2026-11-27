import type { Product } from "@/lib/products";

/* ------------------------------------------------------------------
   PLACEHOLDER REVIEWS — these are sample reviews written for the demo,
   not from real customers. Replace with real reviews (e.g. from the
   backend) before launch.
   ------------------------------------------------------------------ */

export type Review = {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  name: string;
  city: string;
  date: string; // ISO date
};

type Group = "tables" | "cues" | "balls" | "cloth" | "scoreboards" | "lights";

const SAMPLE_REVIEWS: Record<Group, Review[]> = {
  tables: [
    { id: "t1", rating: 5, title: "Plays like a club table", body: "Ball roll is true and the cushions are lively. Installation team levelled it perfectly and left the room spotless.", name: "Rahul M.", city: "Hyderabad", date: "2026-09-14" },
    { id: "t2", rating: 5, title: "Beautiful finish", body: "The wood finish looks even better in person. It has become the centrepiece of our games room.", name: "Sneha R.", city: "Bengaluru", date: "2026-08-02" },
    { id: "t3", rating: 4, title: "Great table, plan your room", body: "Excellent build quality. Check the room size carefully before ordering — you need space around it for the cue.", name: "Arjun K.", city: "Chennai", date: "2026-07-21" },
    { id: "t4", rating: 5, title: "Worth every rupee", body: "Solid slate bed, no roll-off anywhere. Our academy players are very happy with it.", name: "Imran S.", city: "Pune", date: "2026-06-30" },
    { id: "t5", rating: 4, title: "Smooth delivery", body: "Delivered and set up on the promised day. Would have liked a cover included.", name: "Vikram P.", city: "Vijayawada", date: "2026-05-11" },
  ],
  cues: [
    { id: "c1", rating: 5, title: "Lovely balance", body: "Feels well balanced and the tip holds chalk nicely. Cueing has become noticeably straighter.", name: "Karthik V.", city: "Hyderabad", date: "2026-09-02" },
    { id: "c2", rating: 4, title: "Good cue for the price", body: "Straight shaft and a smooth finish. The case could be a little sturdier.", name: "Ananya D.", city: "Mumbai", date: "2026-08-18" },
    { id: "c3", rating: 5, title: "Arrived perfectly packed", body: "No warping at all and it rolled true on the table straight out of the box.", name: "Faizan A.", city: "Delhi", date: "2026-07-07" },
    { id: "c4", rating: 4, title: "Happy with it", body: "Nice grain on the ash shaft. Took a few frames to get used to the weight.", name: "Rohit G.", city: "Kochi", date: "2026-06-12" },
  ],
  balls: [
    { id: "b1", rating: 5, title: "Consistent and bright", body: "Even weight across the set and they run very true. Colours are bright under the lights.", name: "Suresh N.", city: "Hyderabad", date: "2026-09-09" },
    { id: "b2", rating: 5, title: "Proper match balls", body: "Exactly what we wanted for our club. Much better contact than our old set.", name: "Priya L.", city: "Visakhapatnam", date: "2026-07-25" },
    { id: "b3", rating: 4, title: "Good quality", body: "Great set. Delivery took a couple of days longer than expected.", name: "Manoj T.", city: "Nagpur", date: "2026-06-03" },
  ],
  cloth: [
    { id: "cl1", rating: 5, title: "Fast and even", body: "The cloth plays fast and even. Fitting was neat with no wrinkles at the cushions.", name: "Deepak J.", city: "Hyderabad", date: "2026-08-27" },
    { id: "cl2", rating: 4, title: "Good colour", body: "Rich green colour and good nap. Takes a few days of play to settle in.", name: "Ravi C.", city: "Coimbatore", date: "2026-07-14" },
    { id: "cl3", rating: 5, title: "Table feels new again", body: "Re-clothed our old table with this and it plays like new.", name: "Nikhil B.", city: "Warangal", date: "2026-05-29" },
  ],
  scoreboards: [
    { id: "s1", rating: 5, title: "Looks classic on the wall", body: "Well made and easy to read from across the room. Mounting was simple.", name: "Harish K.", city: "Hyderabad", date: "2026-09-05" },
    { id: "s2", rating: 4, title: "Solid build", body: "Good quality. Would be nice to have the mounting screws included.", name: "Meera S.", city: "Bengaluru", date: "2026-07-19" },
    { id: "s3", rating: 5, title: "Perfect for our club", body: "Players love it. Clear numbers and smooth sliders.", name: "Ajay R.", city: "Guntur", date: "2026-06-08" },
  ],
  lights: [
    { id: "l1", rating: 5, title: "No shadows at all", body: "Even light across the whole bed with no shadows near the cushions. Big upgrade.", name: "Sandeep M.", city: "Hyderabad", date: "2026-08-21" },
    { id: "l2", rating: 4, title: "Bright and even", body: "Very good light. Installation needs a proper ceiling anchor, so plan for that.", name: "Kiran P.", city: "Chennai", date: "2026-06-16" },
  ],
};

function groupFor(product: Product): Group {
  const text = `${product.category} ${product.tags.join(" ")}`.toLowerCase();
  if (product.category === "Snooker Tables") return "tables";
  if (text.includes("scoreboard")) return "scoreboards";
  if (text.includes("light")) return "lights";
  if (text.includes("cloth") || text.includes("baize")) return "cloth";
  if (text.includes("ball")) return "balls";
  return "cues";
}

export function getProductReviews(product: Product): Review[] {
  return SAMPLE_REVIEWS[groupFor(product)];
}

export function summarizeReviews(reviews: Review[]) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  return { average: Math.round(average * 10) / 10, total: reviews.length, counts };
}
