/*
  # [Policy] Grant Admin/Staff Read Access to Profiles
  This policy grants read-only (SELECT) access to the `profiles` table for users with the role of 'Admin' or 'Staff'. This is essential for administrative functions like viewing student lists and dashboard statistics.

  ## Query Description:
  - This operation is safe and does not modify any data.
  - It adds a security policy to allow administrative roles to view user profiles.
  - Without this policy, Admins and Staff cannot see user data, causing permission errors in the application.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the policy can be dropped)

  ## Structure Details:
  - Table: `public.profiles`
  - Operation: `CREATE POLICY`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, adds a new SELECT policy.
  - Auth Requirements: Users must be authenticated and have the role 'Admin' or 'Staff'.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. RLS lookups are efficient.
*/

-- Drop the policy if it already exists to ensure idempotency
DROP POLICY IF EXISTS "Allow Admins and Staff to read all profiles" ON public.profiles;

-- Create the policy
CREATE POLICY "Allow Admins and Staff to read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (get_my_claim('role'::text) = '"Admin"'::jsonb) OR
  (get_my_claim('role'::text) = '"Staff"'::jsonb)
);
