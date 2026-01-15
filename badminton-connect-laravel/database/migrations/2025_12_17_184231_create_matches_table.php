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
        Schema::create('matches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('request_id')->nullable();
            $table->foreign('request_id')->references('id')->on('partner_requests')->onDelete('set null');
            $table->uuid('player1');
            $table->foreign('player1')->references('id')->on('users')->onDelete('cascade');
            $table->uuid('player2');
            $table->foreign('player2')->references('id')->on('users')->onDelete('cascade');
            $table->enum('mode', ['friendly', 'tournament']);
            $table->integer('score_player1')->nullable();
            $table->integer('score_player2')->nullable();
            $table->boolean('player1_confirmed')->default(false);
            $table->boolean('player2_confirmed')->default(false);
            $table->uuid('winner')->nullable();
            $table->foreign('winner')->references('id')->on('users')->onDelete('set null');
            $table->integer('experience_awarded')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
