<div class="playing">
	<span class="playing__bar playing__bar1"></span>
	<span class="playing__bar playing__bar2"></span>
	<span class="playing__bar playing__bar3"></span>
</div>

<style>
	.playing {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 0.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		box-sizing: border-box;
	}

	.playing__bar {
		display: inline-block;
		background: white;
		border-radius: 1rem;
		width: 30%;
		height: 100%;
		animation: up-and-down 1.3s ease infinite alternate;
	}

	@media (prefers-color-scheme: dark) {
		.playing__bar {
			background: rgb(245, 153, 199);
		}
	}

	.playing__bar1 {
		height: 60%;
	}

	.playing__bar2 {
		height: 30%;
		animation-delay: -2.2s;
	}

	.playing__bar3 {
		height: 75%;
		animation-delay: -3.7s;
	}

	@keyframes up-and-down {
		10% {
			height: 30%;
		}

		30% {
			height: 100%;
		}

		60% {
			height: 50%;
		}

		80% {
			height: 75%;
		}

		100% {
			height: 60%;
		}
	}
</style>
