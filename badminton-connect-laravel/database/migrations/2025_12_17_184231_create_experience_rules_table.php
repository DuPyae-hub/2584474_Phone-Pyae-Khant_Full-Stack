<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('experience_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('mode', ['friendly', 'tournament'])->unique();
            $table->integer('win_points');
            $table->integer('lose_points');
            $table->integer('friendly_points')->default(5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('experience_rules');
    }
};
