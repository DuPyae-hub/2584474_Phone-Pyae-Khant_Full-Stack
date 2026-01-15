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
        Schema::create('partner_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('created_by_user');
            $table->foreign('created_by_user')->references('id')->on('users')->onDelete('cascade');
            $table->enum('mode', ['friendly', 'tournament']);
            $table->uuid('court_id')->nullable();
            $table->foreign('court_id')->references('id')->on('courts')->onDelete('set null');
            $table->date('date');
            $table->time('time');
            $table->string('phone')->nullable();
            $table->enum('wanted_level', ['beginner', 'intermediate', 'advanced'])->nullable();
            $table->enum('status', ['open', 'matched', 'cancelled', 'arrived', 'completed'])->default('open');
            $table->uuid('matched_user')->nullable();
            $table->foreign('matched_user')->references('id')->on('users')->onDelete('set null');
            $table->integer('players_needed')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_requests');
    }
};
