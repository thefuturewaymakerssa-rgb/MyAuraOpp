const fs = require('fs');
let s = fs.readFileSync('C:\\Users\\Njongo\\my-mvp1\\lib\\database.types.ts', 'utf8');

const profilesBlock = `      profiles: {
        Row: {
          id: string
          name: string | null
          username: string | null
          role: ProfileRole | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          bio: string | null
          email: string | null
          phone: string | null
          dob: string | null
          location: string | null
          province: string | null
          city: string | null
          township: string | null
          trade: string | null
          skills: string[] | null
          hourly_rate: number | null
          is_available: boolean | null
          is_verified: boolean | null
          identity_verified: boolean | null
          onboarded: boolean | null
          verification_tier: VerificationTier | null
          reliability_score: number | null
          featured_until: string | null
          latitude: number | null
          longitude: number | null
          id_selfie: string | null
        }
        Insert: {
          id: string
          name?: string | null
          username?: string | null
          role?: ProfileRole | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          bio?: string | null
          email?: string | null
          phone?: string | null
          dob?: string | null
          location?: string | null
          province?: string | null
          city?: string | null
          township?: string | null
          trade?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          is_available?: boolean | null
          is_verified?: boolean | null
          identity_verified?: boolean | null
          onboarded?: boolean | null
          verification_tier?: string | null
          reliability_score?: number | null
          featured_until?: string | null
          latitude?: number | null
          longitude?: number | null
          id_selfie?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          username?: string | null
          role?: ProfileRole | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          bio?: string | null
          email?: string | null
          phone?: string | null
          dob?: string | null
          location?: string | null
          province?: string | null
          city?: string | null
          township?: string | null
          trade?: string | null
          skills?: string[] | null
          hourly_rate?: number | null
          is_available?: boolean | null
          is_verified?: boolean | null
          identity_verified?: boolean | null
          onboarded?: boolean | null
          verification_tier?: string | null
          reliability_score?: number | null
          featured_until?: string | null
          latitude?: number | null
          longitude?: number | null
          id_selfie?: string | null
        }
      }`;

s = s.replace(/      profiles: \{[\s\S]*?      \}/, profilesBlock);

// Replace MakerWithRelations usage
s = s.replace(/makers: Database\['public'\]\['Tables'\]\['makers'\]\['Row'\] \| null;/g, "makers: any;");
fs.writeFileSync('C:\\Users\\Njongo\\my-mvp1\\lib\\database.types.ts', s, 'utf8');
