import 'package:flutter/material.dart';

class AtelierCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final Color? color;
  final BorderRadius? borderRadius;
  final Border? border;
  final List<BoxShadow>? boxShadow;
  final Gradient? gradient;

  const AtelierCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.color,
    this.borderRadius,
    this.border,
    this.boxShadow,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      padding: padding ?? const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: color ?? const Color(0xFF1C1B1B),
        gradient: gradient,
        borderRadius: borderRadius ?? BorderRadius.circular(20),
        border: border ?? Border.all(color: Colors.white.withOpacity(0.05)),
        boxShadow: boxShadow ?? [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 40,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: child,
    );
  }
}

class AtelierGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double? width;
  final double? height;
  final double opacity;
  final double blur;

  const AtelierGlassCard({
    super.key,
    required this.child,
    this.padding,
    this.width,
    this.height,
    this.opacity = 0.05,
    this.blur = 10,
  });

  @override
  Widget build(BuildContext context) {
    // Note: In real Flutter, one would use BackdropFilter for true glassmorphism.
    // For simplicity and maximum compatibility, we use a semi-transparent container with a refined border.
    return Container(
      width: width,
      height: height,
      padding: padding ?? const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(opacity),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}
