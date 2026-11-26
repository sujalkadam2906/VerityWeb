<?php

namespace Database\Seeders;

use App\Models\BusinessProject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with ONE realistic grounded demo business.
     */
    public function run(): void
    {
        // Only seed demo business fixtures in local/testing environments
        if (app()->environment('production')) {
            return;
        }

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Sarah Miller',
                'password' => Hash::make('password'),
            ]
        );

        BusinessProject::updateOrCreate(
            ['slug' => 'cascade-mountain-roasters'],
            [
                'user_id' => $user->id,
                'name' => 'Cascade Mountain Roasters',
                'category' => 'Specialty Coffee Roastery & Tasting Room',
                'city' => 'Bend, Oregon',
                'address' => '850 NW Wall Street, Bend, OR 97701',
                'phone' => '(541) 389-2244',
                'description' => 'Direct-trade craft coffee roasters sourcing small-lot coffees from origin partners, roasted fresh daily in Bend, Oregon.',
                'links' => [
                    'https://cascademountainroasters.example.com',
                    'https://instagram.com/cascademountainroasters',
                ],
                'status' => 'published',
                'kind' => 'cafe',
                'is_published' => true,
                'theme_settings' => [
                    'color' => '#344d3c',
                    'font' => 'Editorial',
                    'spacing' => 48,
                ],
                'sections_data' => [
                    'sections' => ['Hero', 'Story', 'Services', 'Operating Hours', 'Location & Contact'],
                    'hidden' => [],
                    'headline' => 'Fresh Roasted in the High Desert',
                    'subheadline' => 'Small-lot specialty coffees roasted fresh daily in Bend, Oregon. Welcoming tasting room, precision pourovers, and fresh bags to take home.',
                    'cta' => 'Visit Tasting Room',
                    'phone' => '(541) 389-2244',
                    'city' => 'Bend, Oregon',
                    'name' => 'Cascade Mountain Roasters',
                    'category' => 'Specialty Coffee Roastery & Tasting Room',
                    'operating_hours' => 'Monday – Saturday: 7:00 AM – 4:00 PM (Closed Sundays)',
                    'services' => [
                        [
                            'title' => 'Small-Lot Roasts',
                            'desc' => 'Single-origin coffees sourced directly from farm partners in Ethiopia, Guatemala, and Colombia.',
                        ],
                        [
                            'title' => 'Tasting Room & Pourovers',
                            'desc' => 'Handcrafted espresso, seasonal brew flights, and fresh morning pastries from local Bend bakeries.',
                        ],
                        [
                            'title' => 'Whole Bean Bags',
                            'desc' => 'Freshly roasted whole-bean bags available for retail pick-up and monthly home subscriptions.',
                        ],
                    ],
                ],
            ]
        );
    }
}
